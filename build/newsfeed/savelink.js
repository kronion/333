function toggle_text(shown, hidden) {
  var e = document.getElementById(shown);
  var f = document.getElementById(hidden);
  if(e.style.display == 'inline') {
    e.style.display = 'none';
    f.style.display = 'inline';
  }
}