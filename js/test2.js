function capString( str ) {
  return str.replace(/^(.)|(\s|\-)(.)/g, function(x){return x.toUpperCase();})
}

function randomString( ) {
  return (new Date()).getTime().toString() + Math.round(Math.random()*999).toString();
}

function randomEmail( ) {
  return "rndem" + randomString() + "@gogiitest.com";
}
function randomGcId( ) {
  return "rndgc" + randomString();
}
function randomFbId( ) {
  return "rndfb" + randomString();
}
function randomUsername( ) {
  return "rndun" + randomString();
}

var functionList = {
  "randomString": randomString,
  "randomEmail": randomEmail,
  "randomGcId": randomGcId,
  "randomFbId": randomFbId,
  "randomUsername": randomUsername
};

var execContext = null;
var execState = null;

function execValid( )
{
  return execState != null;
}

function execActIdx( )
{
  return execState.actionIdx;
}

function execMaxAct( )
{
  return execState.actions.length;
}

function initExecContext( execContext )
{
}

function beginExec( data )
{
  var actStack = [];
  for( i in data ) {
    actStack.push(data[i].actions);
  }

  execContext = new ExecContext();
  initExecContext(execContext);
  execState = new ExecEngine(execContext, actStack);
}

function resetExec( data )
{
  beginExec( data );
}

function stopExec( )
{
  execState = null;
  execContext = null;
}

function runExec( done )
{
  return done(new Error('Not Implemented'));
}

function stepExec( done )
{
  edtBeginProc();
  execState.stepOne(function(err){
    edtStopProc();
    done();
  });
}

function _updateDbgMarker( )
{
  $('#actlist li').find('.marker').removeClass('ui-icon ui-icon-arrowthick-1-e');
  if( execValid() ) {
    $('#actlist li').eq( execActIdx() ).find('.marker').addClass('ui-icon ui-icon-arrowthick-1-e');
  }
}

function updateEdtDebug( )
{
  _updateDbgMarker();
  
  $('#dbgpane .varlist li').remove();
  $('#dbgpane .assertres').text('');
  $('#dbgpane .reqmethod').text('');
  $('#dbgpane .requri').text('');
  $('#dbgpane .reqheaders').text('');
  $('#dbgpane .reqbody').text('');
  $('#dbgpane .respstatus').text('');
  $('#dbgpane .respheaders').text('');
  $('#dbgpane .respbody').text('');
  
  if( !execValid() ) {
    return;
  }
  
  for( varName in execContext.variables ) {
    var varVal = execContext.variables[varName];
    
    var varData = $('<li></li>');
    varData.append("<b>#"+varName+"</b>");
    varData.append('<br />');
    varData.append(JSON.stringify(varVal));
    $('#dbgpane .varlist').append(varData);
  }
  
  if( execContext.lastError ) {
    $('#dbgpane .assertres').text(execContext.lastError);
  }
  if( execContext.lastRequest ) {
    if( execContext.lastRequest.reqMethod ) {
      $('#dbgpane .reqmethod').text(execContext.lastRequest.reqMethod);
    }
    if( execContext.lastRequest.reqUri ) {
      $('#dbgpane .requri').text(execContext.lastRequest.reqUri);
    }
    if( execContext.lastRequest.reqHeaders ) {
      var headerLines = [];
      for( headerName in execContext.lastRequest.reqHeaders ) {
        headerLines.push(capString(headerName) + ": " + execContext.lastRequest.reqHeaders[headerName]);
      }
      $('#dbgpane .reqheaders').text(headerLines.join("\n"));
      hljs.highlightBlock($('#dbgpane .reqheaders')[0]);
    }
    if( execContext.lastRequest.reqBody ) {
      $('#dbgpane .reqbody').text(execContext.lastRequest.reqBody);
      hljs.highlightBlock($('#dbgpane .reqbody')[0]);
    }
    if( execContext.lastRequest.respStatus ) {
      $('#dbgpane .respstatus').text(execContext.lastRequest.respStatus + " " + execContext.lastRequest.respStatusText);
    }
    if( execContext.lastRequest.respHeaders ) {
      var headerLines = [];
      for( headerName in execContext.lastRequest.respHeaders ) {
        headerLines.push(capString(headerName) + ": " + execContext.lastRequest.respHeaders[headerName]);
      }
      $('#dbgpane .respheaders').text(headerLines.join("\n"));
      hljs.highlightBlock($('#dbgpane .respheaders')[0]);
    }
    if( execContext.lastRequest.respBody ) {
      $('#dbgpane .respbody').text(execContext.lastRequest.respBody);
      hljs.highlightBlock($('#dbgpane .respbody')[0]);
    }
  }
}

function initEdtDebug( ) {
  $('#actionbar .begindbg').click(function(){
    edtBeginDebug( );
    updateEdtDebug( );
  });
  $('#actionbar .step').click(function(){
    stepExec(function(){
      updateEdtDebug( );
      if( execActIdx() >= execMaxAct() ) {
        $('#actionbar .step').attr('disabled','disabled');
      }
    });
  });
  $('#actionbar .restart').click(function(){
    resetExec( editItemStack );
    updateEdtDebug( );
    edtStopProc();
  });
  updateEdtDebug( );
}

function edtBeginProc( )
{
    $('#actionbar .step').attr('disabled','disabled');
    $('#actionbar .restart').attr('disabled','disabled');
}

function edtStopProc( )
{
    $('#actionbar .step').removeAttr('disabled');
    $('#actionbar .restart').removeAttr('disabled');
}

function edtBeginDebug( )
{
    beginExec( editItemStack );
    $('#actionbar .begindbg').attr('disabled','disabled');
    $('#actionbar .step').removeAttr('disabled');
    $('#actionbar .restart').removeAttr('disabled');
}

function edtStopDebug( )
{
    stopExec();
    $('#actionbar .begindbg').removeAttr('disabled');
    $('#actionbar .step').attr('disabled','disabled');
    $('#actionbar .restart').attr('disabled','disabled');
}

var itemData = [];
var editItem = null;
var editAction = null;
var prevEditId = 0;

function buildItem( container, data, depth )
{
  var item = $('<li></li>');
  var label = $('<label></label>');
  var lbltext = $('<span></span>');
  var childul = $('<ul></ul>');
  var runBtn = $('<div class="ui-icon ui-icon-play">Run</div>');
  var tstBtn = $('<div class="ui-icon ui-icon-plusthick">New Test</div>');
  var grpBtn = $('<div class="ui-icon ui-icon-folder-collapsed">New Group</div>');
  var mupBtn = $('<div class="ui-icon ui-icon-triangle-1-n"></div>');
  var mdnBtn = $('<div class="ui-icon ui-icon-triangle-1-s"></div>');
  var delBtn = $('<div class="ui-icon ui-icon-trash">Delete</div>');
  
  // For debugging
  item.attr('data-itemId', data.id);
  
  // For debugging
  if( data.id == 3 ) {
  	//startEditor(data);
  }
  
  if( data.type == 'group' ) {
    item.addClass( 'item group' );
  } else if( data.type == 'test' ) {
    item.addClass( 'item test' );
  }
  lbltext.text( data.name );
  runBtn.button();
  tstBtn.button();
  grpBtn.button();
  mupBtn.button();
  mdnBtn.button();
  delBtn.button();
  
  runBtn.click(function(){
    runTest(data);
  });
  grpBtn.click(function(){
    _prompt("What would you like to name this new group?", "New Group", function(name){
      if( !name ) return;
      createNewGroup( data.id, name );
    });
  });
  tstBtn.click(function(){
    _prompt("What would you like to name this new test?", "New Test", function(name) {
      if( !name ) return;
      createNewTest( data.id, name );
    });
  });
  delBtn.click(function(){
    _confirm('Are you sure you want to delete the test `' + data.name + ' AND all its children`?',function(res){
      if(!res) return
      removeItem(data.id);
    })
  });
  
  if( data.type == 'test' ) {
  	lbltext.click(function(){
  		startEditorById(data.id);
  	});
  }
  
  label.append(runBtn);
  label.append(tstBtn);
  label.append(grpBtn);
  //label.append(mupBtn);
  //label.append(mdnBtn);
  if( depth > 0 ) {
    label.append(delBtn);
  }
  label.append(lbltext);
  item.append(label);
  item.append(childul);
  container.append(item);
  
  for( child in data.children ) {
    buildItem( childul, data.children[child], depth+1 );
  }
}

function _findTestById( id, list, parents )
{
  if (!parents) parents = []
  
  for( itemId in list ) {
    var item = list[itemId];
    
    var newParents = parents.slice();
    if( item.type == 'test' ) {
      newParents.unshift(item);
    }
    
    if( item.id == id ) {
      return newParents;
    }
    
    var obj = _findTestById( id, item.children, newParents );
    if( obj ) return obj;
  }
  return null;
}

function _execTest( items, done )
{
  var actStack = [];
  for( i in items ) {
    actStack.push(items[i].actions);
  }

  execContext = new ExecContext();
  initExecContext(execContext);
  execState = new ExecEngine(execContext, actStack);
  execState.run(function(err){
    done(err);
  });
}

function _runTest( data, done )
{
  var items = _findTestById( data.id, itemData );
  if( items && items.length > 0 ) {
    
    $('#testrun').append('<div class="testname">' + data.name + '</div>');
    
    var tmpRunning = $('<div class="testrunning">Running...</div>');
    $('#testrun').append(tmpRunning);
    
    _execTest( items, function(err) {
      tmpRunning.remove( );
      if( err ) {
        $('#testrun').append('<div class="reserror"> - Error: ' + err.message + '</div>');
      } else {
        $('#testrun').append('<div class="resokay"> - OK</div>');
      }
      
      done(err);
    });
    
  } else {
    done();
  }
}

function _buildTestList( data, list )
{
  if( !data ) return;
  if( data.type == 'test' ) {
    list.push( data );
  }
  for( v in data.children ) {
    _buildTestList( data.children[v], list );
  }
}

function runTest( data )
{
  $('#testrun').children().remove();
  $('#testrun').dialog('open');
  $('#testrun').on( "dialogbeforeclose", function(event,ui) {
    alert('Cannot close the test runner while tests are still in progress.')
    return false;
  });
  var testList = [];
  _buildTestList( data, testList );
  
  doOneTest = function() {
    if( testList.length == 0 ) {
      $('#testrun').append('<div class="testscomplete">Completed!</div>');
      $('#testrun').off( "dialogbeforeclose" );
      return;
    }
    
    var thisTest = testList.shift();
    _runTest( thisTest, function(err){
      doOneTest();
    })
  };
  doOneTest();
  console.log( testList );

}

function startEditorById( id )
{
  var items = _findTestById( id, itemData );
  if( items && items.length > 0 ) {
    _startEditor( items );
  }
}

function _startEditor( data )
{	
	editItem = data[0]
	editItemStack = data;
	edtStopDebug( );
	updateEditor( );
}

function stopEditor( )
{
	editItem = null;
	edtStopDebug();
	updateEditor( );	
}

function initActionEditor( )
{
  $('#editactiondlg').dialog({
    height: 640,
    width: 600,
    autoOpen: false,
    modal: true,
    title: 'Edit Action',
    position: 'center',
    draggable: true,
    buttons: {
      "Cancel": function() {
        $( this ).dialog( "close" );
      },
      "Save": function() {
        stopActionEditor( );
      }
    }
  }); 
  $('#editactiondlg #actionType').change(function(){
    updateActionEditor( );
  });
  
  $('#editactiondlg #cmpType').change(function(){
    var cmpType = $('#editactiondlg #cmpType').val();
    console.log(cmpType);
    if( cmpType == 'is_blank' || cmpType == 'not_blank' ) {
      $('#editactiondlg .cmpHasRight').hide();
    } else {
      $('#editactiondlg .cmpHasRight').show();
    }
  });
  
  $('#editactiondlg #rightType').change(function(){
    var rightType = $('#editactiondlg #rightType').val();
    if( rightType.substr(0,5) == 'func_' ) {
      $('#editactiondlg #actionRightVal').hide();
    } else {
      $('#editactiondlg #actionRightVal').show();
    }
  });
}

function resetActionEditor( )
{
  $('#editactiondlg #actionType').val( 'rest' );
  $('#editactiondlg #actionMethod').val( 'GET' );
  $('#editactiondlg #uri').val( '' );
  $('#editactiondlg #headers').val( '' );
  $('#editactiondlg #body').val( '' );
  $('#editactiondlg #leftType').val( 'variable' );
  $('#editactiondlg #actionLeftVal').val( '' );
  $('#editactiondlg #cmpType').val( 'not_blank' );
  $('#editactiondlg #rightType').val( 'constant' );
  $('#editactiondlg #actionRightVal').val( '' );
}

function beginActionEditor( )
{
  $('#editactiondlg #actionType').val( editAction.type );

  if( editAction.type == 'store' ) {
    $('#editactiondlg #leftType').val( editAction.leftType );
    $('#editactiondlg #actionLeftVal').val( editAction.left );
    
    if( editAction.rightType == 'value' ) {
      $('#editactiondlg #rightType').val( editAction.rightType );
      $('#editactiondlg #actionRightVal').val( JSON.stringify(editAction.right) );
    } else if( editAction.rightType == 'function' ) {
      $('#editactiondlg #rightType').val( 'func_' + editAction.right );
    } else {
      $('#editactiondlg #rightType').val( editAction.rightType );
      $('#editactiondlg #actionRightVal').val( editAction.right );
    }
  } else if( editAction.type == 'rest' ) {
    var headerList = [];
    for( headerId in editAction.headers ) {
      headerList.push( headerId + ": " + editAction.headers[headerId] );
    }
    $('#editactiondlg #headers').val( headerList.join("\n") );
    $('#editactiondlg #actionMethod').val( editAction.method );
    $('#editactiondlg #uri').val( editAction.uri );
    $('#editactiondlg #body').val( editAction.body );
  } else if( editAction.type == 'assert' ) {
    $('#editactiondlg #leftType').val( editAction.leftType );
    $('#editactiondlg #actionLeftVal').val( editAction.left );
    
    $('#editactiondlg #cmpType').val( editAction.comparator );
    
    if( editAction.rightType == 'value' ) {
      $('#editactiondlg #rightType').val( editAction.rightType );
      $('#editactiondlg #actionRightVal').val( JSON.stringify(editAction.right) );
    } else if( editAction.rightType == 'function' ) {
      $('#editactiondlg #rightType').val( 'func_' + editAction.right );
    } else {
      $('#editactiondlg #rightType').val( editAction.rightType );
      $('#editactiondlg #actionRightVal').val( editAction.right );
    }
  }
 
  updateActionEditor( );
}

function updateActionEditor( )
{
  if( !editAction ) {
    $('#editactiondlg').dialog('close');
    return;
  } else {
    $('#editactiondlg').dialog('open');
  }
  
  var actionType = $('#editactiondlg #actionType').val();
  
  $('#actionDynOpts').children().hide();
  $('#actionDynOpts').children().removeAttr('disabled');
  
  if( actionType == 'store' ) {
    $('#actionDynOpts .usedby-store').show();
    $('#actionDynOpts #leftType').val('variable');
    $('#actionDynOpts #leftType').attr('disabled', 'disabled');
    $('#actionDynOpts #rightType').change();
  } else if( actionType == 'rest' ) {
    $('#actionDynOpts .usedby-rest').show();
  } else if( actionType == 'assert' ) {
    $('#actionDynOpts .usedby-assert').show();
    $('#actionDynOpts #leftType').val('expression');
    $('#actionDynOpts #leftType').attr('disabled', 'disabled');
    $('#actionDynOpts #rightType').change();
    $('#actionDynOpts #cmpType').change();
  }
}

function startActionEditor( data )
{
  resetActionEditor( );
  editAction = data;
  beginActionEditor( );
}

function stopActionEditor( )
{
  newAction = {};
  
  newAction.type = $('#editactiondlg #actionType').val();
  if( newAction.type == 'store' ) {
    newAction.leftType = $('#editactiondlg #leftType').val();
    newAction.left = $('#editactiondlg #actionLeftVal').val();
    
    newAction.rightType = $('#editactiondlg #rightType').val();
    newAction.right = $('#editactiondlg #actionRightVal').val();
    if( newAction.rightType == 'value' ) {
      try {
        console.log(newAction);
        newAction.right = JSON.parse(newAction.right);
        console.log(newAction);
      } catch( e ) {
      }
    }
    if( newAction.rightType.substr(0,5) == 'func_') {
      newAction.right = newAction.rightType.substr(5);
      newAction.rightType = 'function';
    }
  } else if( newAction.type == 'assert' ) {
    newAction.leftType = $('#editactiondlg #leftType').val();
    newAction.left = $('#editactiondlg #actionLeftVal').val();
    newAction.comparator = $('#editactiondlg #cmpType').val();
    
    newAction.rightType = $('#editactiondlg #rightType').val();
    newAction.right = $('#editactiondlg #actionRightVal').val();
    console.log(newAction);
    if( newAction.rightType == 'value' ) {
      try {
        console.log(newAction);
        newAction.right = JSON.parse(newAction.right);
        console.log(newAction);
      } catch( e ) {
      }
    }
    if( newAction.rightType.substr(0,5) == 'func_') {
      newAction.right = newAction.rightType.substr(5);
      newAction.rightType = 'function';
    }
  } else if( newAction.type == 'rest' ) {
    
    var headerText = $('#editactiondlg #headers').val();
    var headerData = headerText.split('\n');
    var headers = { };
    for( headerIdx in headerData ) {
      var headerInfo = headerData[headerIdx];
      var headerSpl = headerInfo.split(': ');
      if( headerSpl[0] && headerSpl[1] ) {
        headers[ headerSpl[0] ] = headerSpl[1];
      }
    }
    
    newAction.method = $('#editactiondlg #actionMethod').val();
    newAction.uri = $('#editactiondlg #uri').val();
    newAction.headers = headers;
    newAction.body = $('#editactiondlg #body').val();
  }
  
  if( editAction.id ) {
    updateAction( editItem.id, editAction.id, newAction );
  } else {
    createAction( editItem.id, newAction );
  }
  
  console.log(newAction);
  
  editAction = null;
  updateActionEditor( );
}

var preMovePrevActionId = null;
function startActionSort( event, ui )
{
  var prevItem = ui.item.prev();
  if( prevItem ) {
    preMovePrevActionId = parseInt(prevItem.attr('data-actionId'));
  }
}
function stopActionSort( event, ui )
{
  var prevItem = ui.item.prev();
  var prevActionId = null;
  if( prevItem ) {
    prevActionId = parseInt(prevItem.attr('data-actionId'));
  }
  actionId = parseInt(ui.item.attr('data-actionId'));
  
  if( prevActionId == preMovePrevActionId ) {
    // Nothing to do.
    return;
  }
  
  moveAction( editItem.id, actionId, prevActionId );
  
  preMovePrevActionId = null;
}

function initEditor( )
{
  $('#testrun').dialog({
    height: 640,
    width: 600,
    autoOpen: false,
    modal: true,
    title: 'Running Tests',
    position: 'center',
    draggable: true
  });
  
  $('#editpane .newaction').click(function(){
    resetActionEditor( );
    editAction = {}; 
    updateActionEditor( );
  });
  
  $('#editpane #btnedittitle').button();
}

function updateEditor( )
{
	if( !editItem ) {
		$('#editpane').addClass('notestsel');
		return;
	} else {
		$('#editpane').removeClass('notestsel');
	}
	
	$('#actpane .title').text( editItem.name );
	
	$('#actlist > li').remove();
	for( actId in editItem.actions ) {
		insertAction( editItem.actions[actId], editItem );
	}
	
  $( "#actlist" ).sortable({
    handle: 'span.type',
    start: startActionSort,
    stop: stopActionSort
  });
  
  $('#editpane #btnedittitle').off('click');
  $('#editpane #btnedittitle').click(function(){
    var newName = prompt('Please enter a new name for this test.', editItem.name );
    if( newName && newName != editItem.name ) {
      renameTest( editItem.id, newName );
    }
  });
}

function actValDisplay( type, value )
{
	if(type == 'expression') {
		return value;
	} else if(type == 'value') {
		return JSON.stringify(value);
	} else if(type == 'function') {
		return value + '()';
	} else if(type == 'variable') {
		return '#' + value;
	} else if(type == '' || !value) {
		return '';
	} else {
		return '??? ' + value + ' ???';
	}
}

function actCmpDisplay( comparator )
{
	if( comparator == 'equal' ) {
		return 'is equal to';
	} else if( comparator == 'not_equal' ) {
		return 'is not equal to';
  } else if( comparator == 'greater') {
    return 'is greater than';
  } else if( comparator == 'lesser') {
    return 'is less than';
  } else if( comparator == 'greater_equal') {
    return 'is greater or equal to';
  } else if( comparator == 'lesser_equal') {
    return 'is less or equal to';
	} else if( comparator == 'is_a' ) {
		return 'is a';
	} else if( comparator == 'is_blank' ) {
		return 'is blank';
	} else if( comparator == 'not_blank' ) {
		return 'is not blank';
	} else {
		return '??? ' + comparator + ' ???';
	}
}

function insertAction( act, item )
{
	actItem = $('<li class="action"></li>');
	actItem.append( '<div class="marker"></div>' );
	actItem.append( '<span class="type">...</span>' );
	actItem.append( '<label>...</label>' );
    actItem.append('<div class="tools"><button class="btn editbtn ui-icon ui-icon-pencil">Edit</button><button class="btn deletebtn ui-icon ui-icon-trash">Delete</button></div>');

  // For tracking re-ordering
  actItem.attr('data-actionId', act.id);

	if( act.type == 'store' ) {
		actItem.addClass('store-action');
		actItem.find('.type').text('STORE');
	} else if(act.type == 'rest') {
		actItem.addClass('request-action');
		actItem.find('.type').text('REQUEST');
	} else if(act.type == 'assert') {
		actItem.addClass('assert-action');
		actItem.find('.type').text('ASSERT');
	} else if(act.type == 'code') {
		actItem.addClass('code-action');
		actItem.find('.type').text('CODE');
	} else if(act.type == 'parent') {
		actItem.addClass('parent-action');
		actItem.find('.type').text('PARENT');
	} else {
		actItem.find('.type').text('??? ' + act.type + ' ???');
	}	
	
	if( act.type == 'store' ) {
		actItem.find('label').html( actValDisplay(act.leftType,act.left) + ' <span class="op">=</span> ' + actValDisplay(act.rightType,act.right) );
	} else if( act.type == 'assert') {
	  if( act.comparator == 'is_blank' || act.comparator == 'not_blank' ) {
	    actItem.find('label').html( actValDisplay(act.leftType,act.left) + ' <span class="op">' + actCmpDisplay(act.comparator) + '</span>' );
	  } else {
		  actItem.find('label').html( actValDisplay(act.leftType,act.left) + ' <span class="op">' + actCmpDisplay(act.comparator) + '</span> ' + actValDisplay(act.rightType,act.right) );
		}
	} else if( act.type == 'rest' ) {
		actItem.find('label').html( '<span class="req-method">' + act.method + '</span> ' + act.uri );
		
		actItem.append('<div class="headers"><h5>HEADERS</h5><pre><code class="json"></code></pre></div>');
		actItem.append('<div class="body"><h5>BODY</h5><pre><code class="json"></code></pre></div>');
		
		var headerLines = [];
		for( headerId in act.headers ) {
			headerVal = act.headers[headerId];
		  headerLines.push( headerId + ": " + headerVal );
		}
		actItem.find('.headers pre code').append( headerLines.join("\n") );
		actItem.find('.body pre code').text( act.body );
		
		hljs.highlightBlock(actItem.find('.headers pre code')[0]);
		hljs.highlightBlock(actItem.find('.body pre code')[0]);
	} else if( act.type == 'parent' ) {
	  actItem.find('label').html('Execute Parent Test');
	}
	
	actItem.find('.editbtn').click(function(){
		startActionEditor( act );
	});
	actItem.find('.deletebtn').click(function(){
		_confirm('Are you sure you want to delete this action?',function(res){
		  if (!res) return;
		  removeAction( act.id, item.id );
		});
	});

	actItem.find('button.ui-icon').button();	
	$('#actlist').append( actItem );
}

function createAction( itemId, data )
{
  startNavUpdate();
  
  ensureLoaded(function(){
    findById(itemId, function(err,obj,parent) {
      data.id = getNextId();
      obj.actions.push(data);
      
      ensureSaved(function(){
        handleItemData( fData.items );
      });
    });
  });

}

function moveAction( itemId, actId, afterActId )
{
  startNavUpdate();
  
  ensureLoaded(function(){
    findById(itemId, function(err,obj,parent) {
      var foundActionIdx = -1;
      for(i in obj.actions) {
        var action = obj.actions[i];
        if (action.id == actId) {
          foundActionIdx = i;
          break;
        }
      }
      
      movedActions = obj.actions.splice(foundActionIdx, 1);
      
      var foundActionAfterIdx = -1;
      for(i in obj.actions) {
        var action = obj.actions[i];
        if (action.id == afterActId) {
          foundActionAfterIdx = i;
          break;
        }
      }
      
      obj.actions.splice(foundActionAfterIdx+1, 0, movedActions[0]);
     
      ensureSaved(function(){
        handleItemData( fData.items );
      });
    });
  });
}

function updateAction( itemId, actId, data )
{
  startNavUpdate();
  
  ensureLoaded(function(){
    findById(itemId, function(err,obj,parent) {
      data.id = actId;
      
      newActions = [];
      for(i in obj.actions) {
        var action = obj.actions[i];
        if (action.id == actId) {
          newActions.push(data);
        } else {
          newActions.push(action);
        }
      }
      obj.actions = newActions;
      
      ensureSaved(function(){
        handleItemData( fData.items );
      });
    });
  });
}

function removeAction( id, itemId )
{
  startNavUpdate();
  
  ensureLoaded(function(){
    findById(itemId, function(err,obj,parent) {
      newActions = [];
      for(i in obj.actions) {
        var action = obj.actions[i];
        if (action.id != id) {
          newActions.push(action);
        }
      }
      obj.actions = newActions;
      
      ensureSaved(function(){
        handleItemData( fData.items );
      });
    });
  });
}

function removeItem( id )
{
  startNavUpdate();
  
  ensureLoaded(function(){
    findById(id, function(err,obj,parent){
      var newChildren = []
      for (itemIdx in parent.children) {
        var item = parent.children[itemIdx];
        if( item.id != id ) {
          newChildren.push(item);
        }
      }
      parent.children = newChildren;
      
      ensureSaved(function(){
        handleItemData( fData.items );
      });
    });
  });
}

function renameTest( itemId, name )
{
  startNavUpdate();
  
  ensureLoaded(function(){
    findById(itemId, function(err,obj,parent){
      obj.name = name;
  
      ensureSaved(function(){
        handleItemData( fData.items );
      });
  });
  });
}

function createNewGroup( parentId, name )
{
  startNavUpdate();
  
  ensureLoaded(function(){
    findById(parentId, function(err,obj,parent){
      obj.children.push({
        id: getNextId(),
        type: 'group',
        name: name,
        children: []
      });
    
      ensureSaved(function(){
        handleItemData( fData.items );
      });
    });
  });
}

function createNewTest( parentId, name )
{
  startNavUpdate();

  ensureLoaded(function(){
    findById(parentId, function(err,obj,parent){
      obj.children.push({
        id: getNextId(),
        type: 'test',
        name: name,
        children: [],
        actions: []
      });
   
      ensureSaved(function(){
        handleItemData( fData.items );
      })
    });
  });

}

var fData = null
function ensureLoaded(done)
{
  if( fData ) {
    done();
  } else {
    chrome.storage.local.get( null, function(data) {
      fData = data;
      
      console.log(fData);
      
      if( !fData.autoincrement ) {
        fData.autoincrement = 1;
      }
    
      if( !fData.items ) {
        fData.items = [{
          "id": getNextId(),
          "type": "group",
          "name": "My Tests",
          "children": []
        }];
      }
      
      console.log(fData);
      
      if (done) {
        done();
      }
    });
  }
}

function ensureSaved(done)
{
  console.log('save');
  console.log(fData);
  chrome.storage.local.set(fData,function(){
    console.log(chrome.runtime.lastError);
    if (done) {
      done();
    }
  });
}

function _confirm(question, done) {
  var answer = $('<div class="prompt_dialog"><span class="question">'+question+'</span></div>');
  var result = false;
  answer.dialog({
    title: "Confirm",
    width: "400px",
    modal: true,
    buttons:{
      "Ok": function() {
        result = true;
        answer.dialog("close");
      },
      "Cancel": function() {
        answer.dialog("close");
      }
    },
    close: function(){
      done(result);
    }
  });
}

function _prompt(question, defaultAnswer, done) {
  var answer = $('<div class="prompt_dialog"><span class="question">'+question+'</span><input type="text" class="answer" /></div>');
  answer.find('.answer').val(defaultAnswer);
  var result = null;
  answer.dialog({
    title: "Prompt",
    width: "400px",
    modal: true,
    buttons:{
      "Ok": function() {
        result = answer.find('.answer').val();
        answer.dialog("close");
      },
      "Cancel": function() {
        answer.dialog("close");
      }
    },
    close: function(){
      done(result);
    }
  });
}

function _findById(id, list, parent) {
  for( itemIdx in list ) {
    item = list[itemIdx];
    if( item.id == id ) {
      return [item, parent];
    }
    fndinfo = _findById(id, item.children, item)
    if(fndinfo) return fndinfo;
  }
  return null;
}

function findById(id, done) {
  obj = _findById(id, fData.items, null);
  if( !obj ) {
    done( new Error('id not found') );
  } else {
    done( null, obj[0], obj[1] ); 
  }
}

function getNextId()
{
  return fData.autoincrement++;
}

function loadItemData()
{
  startNavUpdate();
  ensureLoaded(function(){
    handleItemData( fData.items );
  });
}

function updateItemList( )
{
  for( item in itemData ) {
    buildItem( $('#itemlist'), itemData[item], 0 );
  }
}

function handleItemData( data ) {
  itemData = data;
  $('#itemlist_load').hide();
  updateItemList( );
  if( prevEditId ) {
    startEditorById( prevEditId );
    prevEditId = null;
  }
}

function startNavUpdate( )
{
  itemData = [];
  $('#itemlist li').remove();
  //$('#itemlist_load').show();
  if( editItem ) {
    prevEditId = editItem.id;
  }
  stopEditor();
}

$(document).ready(function(){
  $('#nav #topbar .refresh').button();
  $('button.ui-icon').button();
  
  initEditor( );
  initEdtDebug( );
  initActionEditor( );
  
  $('#nav #refresh').click(function(){
    loadItemData();
  });
  
  loadItemData( );
});