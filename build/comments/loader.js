function loadScriptCached() {
  var elements = document.getElementsByClassName('reactScript');
  for (var i = 0; i < elements.length; i++) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '/js/comments.js';
    script.async = true;
    elements[i].appendChild(script);
  }
}
window.onload = function() {
  loadScriptCached();
};
