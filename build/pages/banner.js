$('.fui-gear').click(function(e) {
  e.preventDefault();
  var element = $('#settings');
  element.is(':visible');
  if (element.is(':visible')) {
    element.hide();
  }
  else {
    element.show();
  }
});

$('.fui-new').click(function(e) {
  e.preventDefault();
  var element = $('#updates');
  if (element.is(':visible')) {
    element.hide();
  }
  else {
    element.show();
  }
});

function checkHide(container, e) {
  if (!container.is(e.target) && container.has(e.target).length === 0) {
    var settings = $('#settings');
    var updates = $('#updates');
    if (container.is(settings)) {
      if ($('.fui-gear').is(e.target)) {
        return;
      }
    }
    else if (container.is(updates)) {
      if ($('.fui-new').is(e.target)) {
        return;
      }
    }
    container.hide();
  }
}

$(document).mouseup(function (e) {
  var container = $('#settings');
  checkHide(container, e);
  container = $('#updates');
  checkHide(container, e);
});
