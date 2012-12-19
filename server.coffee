connect = require 'connect'
express = require 'express'
request = require 'request'
fs = require 'fs'
http = require 'http'
coffeescript = require 'coffee-script'

app = module.exports = express()

# CONFIGURATION

app.use connect.bodyParser();
app.use connect.static(__dirname);
app.use express.logger()
app.use app.router
app.use express.errorHandler({
  dumpExceptions: true
  showStack     : true
})

fData =
  autoincrement: 1
  version: 1
  items: []
lastSaveVer = -1

backupData = (done) ->
  if fData.version isnt lastSaveVer
    lastSaveVer = fData.version
    curTime = (new Date()).getTime()
    fileName = "backups/bak#{curTime}.json"
    fs.writeFile fileName, JSON.stringify(fData), ->
      if done then done()
  else
    done()

autoBackup = () ->
  backupData () ->
    setTimeout autoBackup, 1000

saveData = (done) ->
  fData.version++
  fs.writeFile 'data.json', JSON.stringify(fData,null,'  '), (err) ->
    if done then done()
  
loadData = (done) ->
  fs.readFile 'data.json', (err,data) ->
    fData = JSON.parse data
    if not fData.version then fData.version = 1
    done()
  
getNextId = (done) ->
  done null, fData.autoincrement++
    
_findById = (id, list, parent) ->
  for item in list
    if item.id is id
      return [item,parent]
    fndinfo = _findById id, item.children, item
    if fndinfo then return fndinfo
  return null
findById = (id, done) ->
  obj = _findById id, fData.items, null
  if not obj
    done new Error('id not found'), null, null
  else
    done null, obj[0], obj[1]
    
app.get '/api/data', (req,res,next) ->
  res.send fData.items
  
app.post '/api/delitem', (req,res,next) ->
  id = parseInt(req.body.itemId)
  
  findById id, (err,obj,parent) ->
    if err then return next err
    
    newChildren = []
    for item in parent.children
      if item.id isnt obj.id
        newChildren.push item
    parent.children = newChildren
    
    saveData()
    res.send fData.items
  
app.post '/api/newgroup', (req,res,next) ->
  parentId = parseInt(req.body.parentId)
  name = req.body.name
  
  findById parentId, (err, obj, parent) ->
    if err then return next err
    getNextId (err, newId) ->
      if err then return next err
      newItem = 
        id: newId
        type: 'group'
        name: name
        children: []
      obj.children.push newItem
      
      saveData()
      res.send fData.items
    
app.post '/api/newtest', (req,res,next) ->
  parentId = parseInt(req.body.parentId)
  name = req.body.name
  
  findById parentId, (err, obj, parent) ->
    if err then return next err
    getNextId (err, newId) ->
      if err then return next err
      newItem = 
        id: newId
        type: 'test'
        name: name
        children: []
        actions: []
      obj.children.push newItem
      
      saveData()
      res.send fData.items
    
app.post '/api/newaction', (req,res,next) ->
  itemId = parseInt(req.body.itemId)
  
  findById itemId, (err, obj, parent) ->
    if err then return next err
    
    getNextId (err, newId) ->
      if err then return next err
      
      newAction = req.body.data
      newAction.id = newId
      obj.actions.push newAction
      
      saveData()
      res.send fData.items
  
app.post '/api/moveaction', (req,res,next) ->
  id = parseInt(req.body.id)
  afterId = parseInt(req.body.afterId)
  itemId = parseInt(req.body.itemId)
  
  findById itemId, (err, obj, parent) ->
    if err then return next err
    
    foundAction = null
    for action in obj.actions
      if action.id is id
        foundAction = action
    foundActionIdx = obj.actions.indexOf(foundAction)
    
    movedActions = obj.actions.splice(foundActionIdx,1)
    
    #if the item isnt found here, indexOf returns -1, which is +1'd to 0 which is a valid splice location
    foundActionAfter = null
    for action in obj.actions
      if action.id is afterId
        foundActionAfter = action
    foundActionAfterIdx = obj.actions.indexOf(foundActionAfter)

    obj.actions.splice foundActionAfterIdx+1, 0, movedActions[0]
    
    saveData()
    res.send fData.items
  
app.post '/api/updateaction', (req,res,next) ->
  id = parseInt(req.body.id)
  itemId = parseInt(req.body.itemId)
  
  findById itemId, (err, obj, parent) ->
    if err then return next err
 
    newAction = req.body.data
    newAction.id = id
    
    newActions = []
    for action in obj.actions
      if action.id is id
        newActions.push newAction
      else
        newActions.push action
    obj.actions = newActions
    
    saveData()
    res.send fData.items
  
app.post '/api/delaction', (req,res,next) ->
  id = parseInt(req.body.id)
  itemId = parseInt(req.body.itemId)
  
  findById itemId, (err, obj, parent) ->
    if err then return next err
    
    newActions = []
    for action in obj.actions
      if action.id isnt id
        newActions.push action
    obj.actions = newActions
    
    saveData()
    res.send fData.items
    
app.post '/api/proxy', (req,res,next) ->
  console.log req.body
  
  reqOpts =
    method: req.body.method
    uri: req.body.uri
    headers: req.body.headers
    body: req.body.body
  
  handleResp = (err,resp,data) ->
    if err
      respObj =
        status: 'error'
        message: err.message
    else
      respObj =
        status: 'ok'
        reqMethod: reqOpts.method
        reqUri: reqOpts.uri
        reqHeaders: reqOpts.headers
        reqBody: reqOpts.body
        respStatus: resp.statusCode
        respStatusText: http.STATUS_CODES[resp.statusCode]
        respHeaders: resp.headers
        respBody: data
    console.log respObj
    res.send respObj
  request reqOpts, handleResp

app.get "/js/:fileName.coffee.js", (req,res,next) ->
  fs.readFile ('coffee/'+req.params.fileName+".coffee"), "ascii", (err,data) ->
    if err then return next err
    res.send coffeescript.compile(data)

console.log "Loading Data"
loadData () ->
  console.log "Done."
  autoBackup()
  app.listen(8080)
  console.log "Express server listening"




































