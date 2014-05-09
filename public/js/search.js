$(function() {
  var myvar = [];
  $.getJSON("https://localhost:8443/autocomp", function(data) {
    for (var i = 0; i < data.length; i++) {
      myvar.push(data[i]);
    }
  })
  $( "#autocomplete" ).autocomplete({
    source: myvar,
  });

  // Hover states on the static widgets
  $( "#dialog-link, #icons li" ).hover(
    function() {
      $( this ).addClass( "ui-state-hover" );
    },
    function() {
      $( this ).removeClass( "ui-state-hover" );
    }
  );

  function checkUrl(url){

  }
  $( "#searchbutton" ).click(
    function() {
      $.ajax({
        type: 'HEAD',
        url: 'https://localhost:8443/pages/' + $( '#autocomplete').val(),
        error: function() {
          console.log('error');
          alert('Error');
        },
        success: function() {
          document.location.href = 'https://localhost:8443/pages/' + $( '#autocomplete').val();
        }
      });
    }
  );

  $( "#searchform").submit(function(event) {
    event.preventDefault();
    $.ajax({
      type: 'HEAD',
      url: 'https://localhost:8443/pages/' + $( '#autocomplete').val(),
      success: function() {
        document.location.href = 'https://localhost:8443/pages/' + $( '#autocomplete').val();
      },
      error: function() {
        alert('Error');
      }
    });
  });
});
