/*
	front.js
	Holds logic for popup login.
*/

$(document).ready(function() {
    $(".button").click(function(e) {
    	$(".overlay, .popup").fadeToggle();
        $("body").append(''); $(".popup").show(); 
        $(".close").click(function(e) { 
            $(".popup, .overlay").hide(); 
        }); 
    }); 
    $(".overlay").click(function(e) {
      $(".popup, .overlay").hide();
    });
});
