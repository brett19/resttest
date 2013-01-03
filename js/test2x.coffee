randomString = ->
  (new Date()).getTime().toString() + Math.round(Math.random()*999).toString();
randomEmail = ->
  "rndem" + randomString() + "@gogiitest.com";
randomGcId = ->
  return "rndgc" + randomString();
randomFbId = ->
  return "rndfb" + randomString();
randomUsername = ->
  return "rndun" + randomString();

window.ExecContext = class _ExecContext
  constructor: () ->
    @reset()
    
  reset: () ->
    @variables = {}
    @lastRequest = null
    @lastError = null

window.ExecEngine = class _ExecEngine
  constructor: (@context, actionStack) ->
    # List of functions available to code
    @functions =
      "randomString": randomString
      "randomEmail": randomEmail
      "randomFbId": randomFbId
      "randomGcId": randomGcId
      "randomUsername": randomUsername
    # Copy the action stack, take the highest actionlist from it
    #   as our active one and then remove it from the stack
    @actions = actionStack[0]
    @parentStack = actionStack.slice(1)
    
    console.log @actions
    console.log @parentStack
    
    # Start at the first action
    @actionIdx = 0
  
  _evalReference: (refType, refName) ->
    if refType is 'variable'
      refValue = @context.variables[refName]
      if refValue is undefined
        throw new Error("Referenced an undefined variable `" + refName + "`")
      return refValue
    else if refType is 'function'
      refValue = @functions[refName]
      if typeof(refValue) isnt 'function'
        throw new Error("Referenced an undefined function `" + refName + "`")
      return refValue()
    else if refType is 'expression'
      exprData = @context.lastRequest.exprData
      refValue = jsonPath(exprData, refName)
      if refValue.length < 1
        throw new Error("Expression `" + refName + "` matched nothing")
      else if refValue.length > 1
        throw new Error("Expression `" + refName + "` matched more than one property")
      else
        return refValue[0]
    else if refType is 'value'
      return refName
    return undefined
  
  _evaluateRequestAction: (action, done) ->
    reqMethod = action.method;
    reqUri = action.uri;
    reqHeaders = $.extend({},action.headers);
    reqBody = action.body;
    
    for varName,varValue of @context.variables
      reqUri = reqUri.replace('#'+varName,varValue);
      for headerName,headerValue of reqHeaders
        reqHeaders[headerName] = headerValue.replace('#'+varName,varValue);
      reqBody = reqBody.replace('#'+varName,varValue);
    
    @context.lastRequest = null
    
    myReq = new XMLHttpRequest()
    myReq.onreadystatechange = () =>
      if myReq.readyState is 4
        respHeaders = {}
        headerLines = myReq.getAllResponseHeaders().split("\n")
        for header in headerLines
          headerSpl = header.split(": ")
          if headerSpl[0] and headerSpl[1]
            respHeaders[ headerSpl[0] ] = headerSpl[1]
            
        @context.lastRequest = 
          reqMethod: reqMethod
          reqUri: reqUri
          reqHeaders: reqHeaders
          reqBody: reqBody
          respStatus: myReq.status
          respStatusText: myReq.statusText
          respHeaders: respHeaders
          respBody: myReq.responseText
        
        try
          # Try to parse as JSON
          @context.lastRequest.respBodyObj = JSON.parse(@context.lastRequest.respBody)
          # Regenerate JSON string to format it
          @context.lastRequest.respBody = JSON.stringify(@context.lastRequest.respBodyObj,null,'  ')
        catch e
          # Do Nothing
          
        @context.lastRequest.exprData = $.extend(true, {
          "_status": @context.lastRequest.respStatus,
          "_headers": @context.lastRequest.respHeaders
        }, @context.lastRequest.respBodyObj);
        
        return done null
        
    myReq.open reqMethod, reqUri
    for headerName,headerValue of reqHeaders
      myReq.setRequestHeader headerName, headerValue
    myReq.send(reqBody);
    
    


  _evaluateStoreAction: (action, done) ->
    # Ensure this is valid
    if action.leftType isnt 'variable'
      return done new Error('Internal Error: store actions must have a leftType of variable')
    # Try to get the data they want to store
    
    try
      rightValue = @_evalReference action.rightType, action.right
    catch err
      return done err
    # Store it!
    @context.variables[action.left] = rightValue
    done(null)
    
  _evaluateAssertAction: (action, done) ->
    try
      rightValue = @_evalReference action.rightType, action.right
    try
      leftValue = @_evalReference action.leftType, action.left
      
    if action.comparator is 'is_blank'
      unless !leftValue
        return done new Error("Assertion Failed: #{action.leftType} `#{action.left}` (#{JSON.stringify(leftValue)}) must be blank")
    else if action.comparator is 'not_blank'
      unless leftValue
        return done new Error("Assertion Failed: #{action.leftType} `#{action.left}` (#{JSON.stringify(leftValue)}) must not be blank")
    else if action.comparator is 'equal'
      unless leftValue == rightValue
        return done new Error("Assertion Failed: #{action.leftType} `#{action.left}` (#{JSON.stringify(leftValue)}) must be equal to #{action.rightType} `#{action.right}` (#{JSON.stringify(rightValue)})")
    else if action.comparator is 'not_equal'
      unless leftValue != rightValue
        return done new Error("Assertion Failed: #{action.leftType} `#{action.left}` (#{JSON.stringify(leftValue)}) must not be equal to #{action.rightType} `#{action.right}` (#{JSON.stringify(rightValue)})")
    else if action.comparator is 'greater'
      unless leftValue > rightValue
        return done new Error("Assertion Failed: #{action.leftType} `#{action.left}` (#{JSON.stringify(leftValue)}) must be greater than #{action.rightType} `#{action.right}` (#{JSON.stringify(rightValue)})")
    else if action.comparator is 'lesser'
      unless leftValue < rightValue
        return done new Error("Assertion Failed: #{action.leftType} `#{action.left}` (#{JSON.stringify(leftValue)}) must be less than #{action.rightType} `#{action.right}` (#{JSON.stringify(rightValue)})")
    else if action.comparator is 'greater_equal'
      unless leftValue >= rightValue
        return done new Error("Assertion Failed: #{action.leftType} `#{action.left}` (#{JSON.stringify(leftValue)}) must be greater or equal to #{action.rightType} `#{action.right}` (#{JSON.stringify(rightValue)})")
    else if action.comparator is 'lesser_equal'
      unless leftValue <= rightValue
        return done new Error("Assertion Failed: #{action.leftType} `#{action.left}` (#{JSON.stringify(leftValue)}) must be less or equal to #{action.rightType} `#{action.right}` (#{JSON.stringify(rightValue)})")
    else if action.comparator is 'is_a'
      unless typeof(leftValue) == rightValue
        return done new Error("Assertion Failed: type of #{action.leftType} `#{action.left}` (#{JSON.stringify(leftValue)}) must be #{action.rightType} `#{action.right}` (#{JSON.stringify(rightValue)})")
    done(null)
    
  _evaluateParentAction: (action, done) ->
    if @parentStack.length is 0
      return done new Error("there are no parents to execute")
    parentEngine = new _ExecEngine(@context, @parentStack)
    parentEngine.run (err) ->
      if err then return done new Error("parent test failed")
      done null
    
  _evaluateCodeAction: (action, done) ->
    done(new Error("Code actions are not yet supported"))
  
  _evaluateAction: (action, done) ->
    if action.type is 'rest'
      @_evaluateRequestAction action, done
    else if action.type is 'store'
      @_evaluateStoreAction action, done
    else if action.type is 'assert'
      @_evaluateAssertAction action, done
    else if action.type is 'parent'
      @_evaluateParentAction action, done
    else if action.type is 'code'
      @_evaluateCodeAction action, done
  
  stepOne: (done) ->
    @context.lastError = null
    @_evaluateAction @actions[@actionIdx], (err) =>
      if err
        @context.lastError = err.message
        return done err
      @actionIdx++
      done null
      
  run: (done) ->
    executeOne = =>
      if @actionIdx < @actions.length
        @stepOne (err) =>
          if err then return done err
          executeOne()
      else
        return done null
    executeOne()
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
