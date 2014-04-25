console.log("Testing external script.");

var a=window, b=document, c=encodeURIComponent;
// var d=a.open("https://localhost:8443/bookmark/" + c(b.location),
// 			"bookmark_popup",
// 			"left="+((a.screenX||a.screenLeft)+10)+",top="+((a.screenY||a.screenTop)+10)+",height=420px,width=550px,resizable=1,alwaysRaised=1"
// );
//d.focus();

s = b.createElement("IFRAME");
s.id = "bookmark_popup";
s.src = "https://localhost:8443/bookmark/" + c(b.location);
console.log(s.src);
// s.style.top="0";
// s.style.left="0";
// s.style.height="100%25";
// s.style.width="100%25";
// s.style.zIndex="16777270";
// s.style.border="none";
s.style.visibility="hidden";
s.onload=function(){
 	// s.style.visibility="visibile";
	console.log("iframe loaded!")
	e = document.getElementsByTagName("body")[0];
	e.innerHTML = "<div><p> LINK SAVED! </p></div>" + e.innerHTML;
 }
b.body.appendChild(s);



// a.setTimeout(function(){d.focus()},300);

console.log("googled");




// // // create an overlay


// console.log(b);

// home_loc = "https://localhost:8443/bookmark/"
// uri_enc = encodeURIComponent(document.location.href);




// window.location = home_loc + uri_enc;

// //  first check if logged in

// if not logged in:


// // then send request


// position:fixed 
