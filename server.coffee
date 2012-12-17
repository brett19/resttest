connect = require 'connect'
express = require 'express'
fs = require 'fs'

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
  return #Disabled
  backupData () ->
    setTimeout autoBackup, 1000

saveData = (done) ->
  fData.version++
  
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
    
    res.send fData.items
    
console.log "Loading Data"
loadData () ->
  console.log "Done."
  autoBackup()
  app.listen(8080)
  console.log "Express server listening"




































