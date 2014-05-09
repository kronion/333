$(function(){
  $('.archive').each(function(index, element) {
    $('#'+element.id).click(function(e){
      e.preventDefault();
      url = element.parentNode.className;
      var data = {url:  url}
      $.ajax({
        type:  'POST',
        data:  JSON.stringify(data),
        contentType:  'application/json',
        url: 'https://localhost:8443/addLink',
        success:  function(data) {
          console.log('success');
          console.log(JSON.stringify(data));
        }
      });
    });
  });
});