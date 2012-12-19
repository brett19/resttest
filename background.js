chrome.app.runtime.onLaunched.addListener(function() { 
  chrome.app.window.create('test2.html', {
    id: 'main_window',
    minWidth: 1024,
    minHeight: 768,
    width: 1024,
    height: 768
  });
});