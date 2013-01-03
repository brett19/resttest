// Generated by CoffeeScript 1.4.0
(function() {
  var randomEmail, randomFbId, randomGcId, randomString, randomUsername, _ExecContext, _ExecEngine;

  randomString = function() {
    return (new Date()).getTime().toString() + Math.round(Math.random() * 999).toString();
  };

  randomEmail = function() {
    return "rndem" + randomString() + "@gogiitest.com";
  };

  randomGcId = function() {
    return "rndgc" + randomString();
  };

  randomFbId = function() {
    return "rndfb" + randomString();
  };

  randomUsername = function() {
    return "rndun" + randomString();
  };

  window.ExecContext = _ExecContext = (function() {

    function _ExecContext() {
      this.reset();
    }

    _ExecContext.prototype.reset = function() {
      this.variables = {};
      this.lastRequest = null;
      return this.lastError = null;
    };

    return _ExecContext;

  })();

  window.ExecEngine = _ExecEngine = (function() {

    function _ExecEngine(context, actionStack) {
      this.context = context;
      this.functions = {
        "randomString": randomString,
        "randomEmail": randomEmail,
        "randomFbId": randomFbId,
        "randomGcId": randomGcId,
        "randomUsername": randomUsername
      };
      this.actions = actionStack[0];
      this.parentStack = actionStack.slice(1);
      console.log(this.actions);
      console.log(this.parentStack);
      this.actionIdx = 0;
    }

    _ExecEngine.prototype._evalReference = function(refType, refName) {
      var exprData, refValue;
      if (refType === 'variable') {
        refValue = this.context.variables[refName];
        if (refValue === void 0) {
          throw new Error("Referenced an undefined variable `" + refName + "`");
        }
        return refValue;
      } else if (refType === 'function') {
        refValue = this.functions[refName];
        if (typeof refValue !== 'function') {
          throw new Error("Referenced an undefined function `" + refName + "`");
        }
        return refValue();
      } else if (refType === 'expression') {
        exprData = this.context.lastRequest.exprData;
        refValue = jsonPath(exprData, refName);
        if (refValue.length < 1) {
          throw new Error("Expression `" + refName + "` matched nothing");
        } else if (refValue.length > 1) {
          throw new Error("Expression `" + refName + "` matched more than one property");
        } else {
          return refValue[0];
        }
      } else if (refType === 'value') {
        return refName;
      }
      return void 0;
    };

    _ExecEngine.prototype._evaluateRequestAction = function(action, done) {
      var headerName, headerValue, myReq, reqBody, reqHeaders, reqMethod, reqUri, varName, varValue, _ref,
        _this = this;
      reqMethod = action.method;
      reqUri = action.uri;
      reqHeaders = $.extend({}, action.headers);
      reqBody = action.body;
      _ref = this.context.variables;
      for (varName in _ref) {
        varValue = _ref[varName];
        reqUri = reqUri.replace('#' + varName, varValue);
        for (headerName in reqHeaders) {
          headerValue = reqHeaders[headerName];
          reqHeaders[headerName] = headerValue.replace('#' + varName, varValue);
        }
        reqBody = reqBody.replace('#' + varName, varValue);
      }
      this.context.lastRequest = null;
      myReq = new XMLHttpRequest();
      myReq.onreadystatechange = function() {
        var header, headerLines, headerSpl, respHeaders, _i, _len;
        if (myReq.readyState === 4) {
          respHeaders = {};
          headerLines = myReq.getAllResponseHeaders().split("\n");
          for (_i = 0, _len = headerLines.length; _i < _len; _i++) {
            header = headerLines[_i];
            headerSpl = header.split(": ");
            if (headerSpl[0] && headerSpl[1]) {
              respHeaders[headerSpl[0]] = headerSpl[1];
            }
          }
          _this.context.lastRequest = {
            reqMethod: reqMethod,
            reqUri: reqUri,
            reqHeaders: reqHeaders,
            reqBody: reqBody,
            respStatus: myReq.status,
            respStatusText: myReq.statusText,
            respHeaders: respHeaders,
            respBody: myReq.responseText
          };
          try {
            _this.context.lastRequest.respBodyObj = JSON.parse(_this.context.lastRequest.respBody);
            _this.context.lastRequest.respBody = JSON.stringify(_this.context.lastRequest.respBodyObj, null, '  ');
          } catch (e) {

          }
          _this.context.lastRequest.exprData = $.extend(true, {
            "_status": _this.context.lastRequest.respStatus,
            "_headers": _this.context.lastRequest.respHeaders
          }, _this.context.lastRequest.respBodyObj);
          return done(null);
        }
      };
      myReq.open(reqMethod, reqUri);
      for (headerName in reqHeaders) {
        headerValue = reqHeaders[headerName];
        myReq.setRequestHeader(headerName, headerValue);
      }
      return myReq.send(reqBody);
    };

    _ExecEngine.prototype._evaluateStoreAction = function(action, done) {
      var rightValue;
      if (action.leftType !== 'variable') {
        return done(new Error('Internal Error: store actions must have a leftType of variable'));
      }
      try {
        rightValue = this._evalReference(action.rightType, action.right);
      } catch (err) {
        return done(err);
      }
      this.context.variables[action.left] = rightValue;
      return done(null);
    };

    _ExecEngine.prototype._evaluateAssertAction = function(action, done) {
      var leftValue, rightValue;
      try {
        rightValue = this._evalReference(action.rightType, action.right);
      } catch (_error) {}
      try {
        leftValue = this._evalReference(action.leftType, action.left);
      } catch (_error) {}
      if (action.comparator === 'is_blank') {
        if (!!leftValue) {
          return done(new Error("Assertion Failed: " + action.leftType + " `" + action.left + "` (" + (JSON.stringify(leftValue)) + ") must be blank"));
        }
      } else if (action.comparator === 'not_blank') {
        if (!leftValue) {
          return done(new Error("Assertion Failed: " + action.leftType + " `" + action.left + "` (" + (JSON.stringify(leftValue)) + ") must not be blank"));
        }
      } else if (action.comparator === 'equal') {
        if (leftValue !== rightValue) {
          return done(new Error("Assertion Failed: " + action.leftType + " `" + action.left + "` (" + (JSON.stringify(leftValue)) + ") must be equal to " + action.rightType + " `" + action.right + "` (" + (JSON.stringify(rightValue)) + ")"));
        }
      } else if (action.comparator === 'not_equal') {
        if (leftValue === rightValue) {
          return done(new Error("Assertion Failed: " + action.leftType + " `" + action.left + "` (" + (JSON.stringify(leftValue)) + ") must not be equal to " + action.rightType + " `" + action.right + "` (" + (JSON.stringify(rightValue)) + ")"));
        }
      } else if (action.comparator === 'greater') {
        if (!(leftValue > rightValue)) {
          return done(new Error("Assertion Failed: " + action.leftType + " `" + action.left + "` (" + (JSON.stringify(leftValue)) + ") must be greater than " + action.rightType + " `" + action.right + "` (" + (JSON.stringify(rightValue)) + ")"));
        }
      } else if (action.comparator === 'lesser') {
        if (!(leftValue < rightValue)) {
          return done(new Error("Assertion Failed: " + action.leftType + " `" + action.left + "` (" + (JSON.stringify(leftValue)) + ") must be less than " + action.rightType + " `" + action.right + "` (" + (JSON.stringify(rightValue)) + ")"));
        }
      } else if (action.comparator === 'greater_equal') {
        if (!(leftValue >= rightValue)) {
          return done(new Error("Assertion Failed: " + action.leftType + " `" + action.left + "` (" + (JSON.stringify(leftValue)) + ") must be greater or equal to " + action.rightType + " `" + action.right + "` (" + (JSON.stringify(rightValue)) + ")"));
        }
      } else if (action.comparator === 'lesser_equal') {
        if (!(leftValue <= rightValue)) {
          return done(new Error("Assertion Failed: " + action.leftType + " `" + action.left + "` (" + (JSON.stringify(leftValue)) + ") must be less or equal to " + action.rightType + " `" + action.right + "` (" + (JSON.stringify(rightValue)) + ")"));
        }
      } else if (action.comparator === 'is_a') {
        if (typeof leftValue !== rightValue) {
          return done(new Error("Assertion Failed: type of " + action.leftType + " `" + action.left + "` (" + (JSON.stringify(leftValue)) + ") must be " + action.rightType + " `" + action.right + "` (" + (JSON.stringify(rightValue)) + ")"));
        }
      }
      return done(null);
    };

    _ExecEngine.prototype._evaluateParentAction = function(action, done) {
      var parentEngine;
      if (this.parentStack.length === 0) {
        return done(new Error("there are no parents to execute"));
      }
      parentEngine = new _ExecEngine(this.context, this.parentStack);
      return parentEngine.run(function(err) {
        if (err) {
          return done(new Error("parent test failed"));
        }
        return done(null);
      });
    };

    _ExecEngine.prototype._evaluateCodeAction = function(action, done) {
      return done(new Error("Code actions are not yet supported"));
    };

    _ExecEngine.prototype._evaluateAction = function(action, done) {
      if (action.type === 'rest') {
        return this._evaluateRequestAction(action, done);
      } else if (action.type === 'store') {
        return this._evaluateStoreAction(action, done);
      } else if (action.type === 'assert') {
        return this._evaluateAssertAction(action, done);
      } else if (action.type === 'parent') {
        return this._evaluateParentAction(action, done);
      } else if (action.type === 'code') {
        return this._evaluateCodeAction(action, done);
      }
    };

    _ExecEngine.prototype.stepOne = function(done) {
      var _this = this;
      this.context.lastError = null;
      return this._evaluateAction(this.actions[this.actionIdx], function(err) {
        if (err) {
          _this.context.lastError = err.message;
          return done(err);
        }
        _this.actionIdx++;
        return done(null);
      });
    };

    _ExecEngine.prototype.run = function(done) {
      var executeOne,
        _this = this;
      executeOne = function() {
        if (_this.actionIdx < _this.actions.length) {
          return _this.stepOne(function(err) {
            if (err) {
              return done(err);
            }
            return executeOne();
          });
        } else {
          return done(null);
        }
      };
      return executeOne();
    };

    return _ExecEngine;

  })();

}).call(this);
