<?php
    $fdata = file_get_contents('data.json');
    $data = json_decode($fdata, true);
    
    function getIncrId( ) {
      global $data;
      return $data['autoincrement']++;
    }
    
    function &recursiveFind( &$itemlist, $id, &$parent = null ) {
      foreach( $itemlist as &$item ) {
        if( $item['id'] == $id ) {
          return $item;
        }
        $obj =& recursiveFind( $item['children'], $id, $item );
        if( $obj ) return $obj; 
      }
      return false;
    }
    
    function recursiveDelete( $itemlist, $id ) {
      foreach( $itemlist as $idx => $item ) {
        if( $item['id'] == $id ) {
          array_splice( $itemlist, $idx, 1 );
          break;
        }
        $itemlist[$idx]['children'] = recursiveDelete( $itemlist[$idx]['children'], $id );
      }
      return $itemlist;
    }
    
    if( isset($_REQUEST['act']) ) {
      if( $_REQUEST['act'] == 'newgroup' ) {
        $parentId = $_REQUEST['parentId'];
        $name = $_REQUEST['name'];
        $item =& recursiveFind($data['items'],$parentId);
        
        $item['children'][] = array(
          'id' => getIncrId(),
          'type' => 'group',
          'name' => $name,
          'children' => array()
        );
      }
      if( $_REQUEST['act'] == 'newtest' ) {
        $parentId = $_REQUEST['parentId'];
        $name = $_REQUEST['name'];
        $item =& recursiveFind($data['items'],$parentId);
        
        $item['children'][] = array(
          'id' => getIncrId(),
          'type' => 'test',
          'name' => $name,
          'children' => array(),
          'actions' => array()
        );
      }
      
      if( $_REQUEST['act'] == 'itemup' ) {
        $itemId = $_REQUEST['itemId'];
        
      }
      
      if( $_REQUEST['act'] == 'delitem' ) {
        $itemId = $_REQUEST['itemId'];
        $data['items'] = recursiveDelete($data['items'], $itemId);
        
      }
      
      $fdata = json_encode($data,JSON_PRETTY_PRINT);
      file_put_contents('data.json',$fdata);
    }

    header('Content-Type: application/json');
    echo json_encode($data['items']);
?>