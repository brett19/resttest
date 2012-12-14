<?php
  $method = $_REQUEST['method'];
  $uri = $_REQUEST['uri'];
  $data = $_REQUEST['data'];
  $headers = $_REQUEST['headers'];

  $req = new HttpRequest( $uri );
  switch($method) {
    case 'GET': $req->setMethod(HTTP_METH_GET); break;
    case 'POST': $req->setMethod(HTTP_METH_POST); break;
    case 'PUT': $req->setMethod(HTTP_METH_PUT); break;
    case 'DELETE': $req->setMethod(HTTP_METH_DELETE); break;
  }
  $req->setBody($data);
  $req->setHeaders($headers);
  $resp = $req->send();
  
  // set URL and other appropriate options
  
  /*
  curl_setopt($ch, CURLOPT_URL, $uri);
  curl_setopt($ch, CURLOPT_HEADER, 1);
  curl_setopt($ch, CURLOPT_HTTPHEADER, $hdrinfo);
  curl_setopt($ch, CURLINFO_HEADER_OUT, 1);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
  
  // grab URL and pass it to the browser
  $retdata = curl_exec($ch);
  
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  
  $rh = curl_getinfo($ch, CURLINFO_HEADER_OUT);
  $rqh = explode("\r\n", trim($rh));
  $reqheaders = array();
  foreach($rqh as $header) {
    $hh = explode(':',$header,2);
    // Check for response header
    if(count($hh) < 2 ) continue;
    $reqheaders[trim($hh[0])] = trim($hh[1]);
  }
  
  $rd = explode("\r\n\r\n", $retdata, 2);
  
  $rhs = explode("\r\n", trim($rd[0]));
  $respheaders = array();
  foreach($rhs as $header) {
    $hh = explode(':',$header,2);
    // Check for response header
    if(count($hh) < 2 ) continue;
    $respheaders[trim($hh[0])] = trim($hh[1]);
  }
  $respbody = $rd[1];
  
  // close cURL resource, and free up system resources
  curl_close($ch);
  */
  
  $retval = array( );
  $retval['req_method'] = $method;
  $retval['req_uri'] = $req->getUrl();
  $retval['req_headers'] = $req->getHeaders();
  $retval['req_body'] = $req->getBody();
  $retval['resp_status'] = $resp->getResponseCode();
  $retval['resp_headers'] = $resp->getHeaders();
  $retval['resp_body'] = $resp->getBody();
  
  echo json_encode($retval);
