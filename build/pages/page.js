function change_async () {
  var data = new FormData($('#prof-upload')[0]);
  console.log(data);
  $.ajax({
    url: $('#prof-upload').attr('action'),
    type: 'POST',
    data: data,
    processData: false,
    contentType: false,
    success: function (response) {
      console.log(response);
      $('#prof-pic').css('background-image', 'url(' + response + ')');
    }
  });
}

$('#follow').click(function(e) {
  e.preventDefault();
  var self = this;
  $.post($(self).attr('href'), function (data) {
    console.log(data);
    if (data.response === 1) {
      console.log('here');
      $(self).attr('disabled', true);
      $(self).addClass('button-disabled');
      $(self).removeClass('button-primary');
    }
  });
});

$('#followees').click(function(e) {
  e.preventDefault();
  var self = this;
  $.get($(self).attr('href'), function (data) {
    alert(data);
  });
});

$('#followers').click(function(e) {
  e.preventDefault();
  var self = this;
  $.get($(self).attr('href'), function (data) {
    alert(data);
  });
});