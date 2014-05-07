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

  $( "#searchbutton" ).click(
    function() {
      var searchval = $( '#autocomplete').val();
      document.location.href = 'https://localhost:8443/pages/' + searchval;
  })

});

