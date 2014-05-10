$('.archive').each(function(index, element) {
  $('#'+element.id).click(function(e){
    e.preventDefault();
    url = $(element).attr('href');
    var data = {url:  url};
    $.ajax({
      type:  'POST',
      data:  JSON.stringify(data),
      contentType:  'application/json',
      url: 'https://localhost:8443/addLink'
    });
  });
});
