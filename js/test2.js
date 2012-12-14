var itemData = [];

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

function removeItem( id )
{
  startNavUpdate();
  $.ajax({
    type: 'POST',
    url: 'test2.php',
    dataType: 'json',
    data: {
      act: 'delitem',
      itemId: id
    },
    success: handleItemData
  });
}

function createNewGroup( parentId, name )
{
  startNavUpdate();
  $.ajax({
    type: 'POST',
    url: 'test2.php',
    dataType: 'json',
    data: {
      act: 'newgroup',
      parentId: parentId,
      name: name
    },
    success: handleItemData
  });
}

function createNewTest( parentId, name )
{
  startNavUpdate();
  $.ajax({
    type: 'POST',
    url: 'test2.php',
    dataType: 'json',
    data: {
      act: 'newtest',
      parentId: parentId,
      name: name
    },
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
}

function startNavUpdate( )
{
  itemData = [];
  $('#itemlist li').remove();
  $('#itemlist_load').show();
}

function loadItemData()
{
  startNavUpdate();
  $.ajax({
    type: 'POST',
    url: 'test2.php',
    dataType: 'json',
    success: function(data, textStatus, xhr) {
      itemData = data;
      $('#itemlist_load').hide();
      updateItemList( );
    }
  });
}

$(document).ready(function(){
  $('#nav #topbar .refresh').button();
  $('.ui-icon').button();
  
  $('#nav #refresh').click(function(){
    loadItemData();
  });
  
  loadItemData( );
});