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

function beginExec( data )
{
  var actStack = [];
  for( i in data ) {
    actStack.push(data[i].actions);
  }
  console.log(actStack);
  execContext = new ExecContext();
  execContext.variables['url'] = 'http://api.archiegameserver.com:3335';
  execState = new ExecEngine(execContext, actStack);
}

function resetExec( data )
{
  var actStack = [];
  for( i in data ) {
    actStack.push(data[i].actions);
  }
  execState = new ExecEngine(execContext, actStack);
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
  
  grpBtn.click(function(){
    var name = prompt("What would you like to name this new group?", "New Group");
    if( !name ) return;
    createNewGroup( data.id, name );
  });
  tstBtn.click(function(){
    var name = prompt("What would you like to name this new test?", "New Test");
    if( !name ) return;
    createNewTest( data.id, name );
  });
  delBtn.click(function(){
    if(confirm('Are you sure you want to delete the test `' + data.name + '`?')) {
      removeItem(data.id);
    }
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

function _findById( id, list, parents )
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
    
    var obj = _findById( id, item.children, newParents );
    if( obj ) return obj;
  }
  return null;
}

function startEditorById( id )
{
  var items = _findById( id, itemData );
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
  $('#editactiondlg #uri').val( '/' );
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
      headers[ headerSpl[0] ] = headerSpl[1];
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
  $('#editpane .newaction').click(function(){
    resetActionEditor();
    startActionEditor({});
  });

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
		if(confirm('Are you sure you want to delete this action?')) {
			removeAction( act.id, item.id );
		}
	});

	actItem.find('button.ui-icon').button();	
	$('#actlist').append( actItem );
}

function createAction( itemId, data )
{
  startNavUpdate();
  $.ajax({
    type: 'POST',
    url: 'api/newaction',
    dataType: 'json',
    processData: false,
    contentType: 'application/json',
    data: JSON.stringify({
      itemId: itemId,
      data: data
    }),
    success: handleItemData
  });
}

function moveAction( itemId, actId, afterActId )
{
  startNavUpdate();
  $.ajax({
    type: 'POST',
    url: 'api/moveaction',
    dataType: 'json',
    processData: false,
    contentType: 'application/json',
    data: JSON.stringify({
      itemId: itemId,
      id: actId,
      afterId: afterActId
    }),
    success: handleItemData
  });
}

function updateAction( itemId, actId, data )
{
  startNavUpdate();
  $.ajax({
    type: 'POST',
    url: 'api/updateaction',
    dataType: 'json',
    processData: false,
    contentType: 'application/json',
    data: JSON.stringify({
      itemId: itemId,
      id: actId,
      data: data
    }),
    success: handleItemData
  });
}

function removeAction( id, itemId )
{
  startNavUpdate();
  $.ajax({
    type: 'POST',
    url: 'api/delaction',
    dataType: 'json',
    processData: false,
    contentType: 'application/json',
    data: JSON.stringify({
      id: id,
      itemId: itemId
    }),
    success: handleItemData
  });
}

function removeItem( id )
{
  startNavUpdate();
  $.ajax({
    type: 'POST',
    url: 'api/delitem',
    dataType: 'json',
    processData: false,
    contentType: 'application/json',
    data: JSON.stringify({
      itemId: id
    }),
    success: handleItemData
  });
}

function createNewGroup( parentId, name )
{
  startNavUpdate();
  $.ajax({
    type: 'POST',
    url: 'api/newgroup',
    dataType: 'json',
    processData: false,
    contentType: 'application/json',
    data: JSON.stringify({
      parentId: parentId,
      name: name
    }),
    success: handleItemData
  });
}

function createNewTest( parentId, name )
{
  startNavUpdate();
  $.ajax({
    type: 'POST',
    url: 'api/newtest',
    dataType: 'json',
    processData: false,
    contentType: 'application/json',
    data: JSON.stringify({
      parentId: parentId,
      name: name
    }),
    success: handleItemData
  });
}

function loadItemData()
{
  startNavUpdate();
  $.ajax({
    type: 'GET',
    url: 'api/data',
    dataType: 'json',
    success: handleItemData
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
  $('#itemlist_load').show();
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