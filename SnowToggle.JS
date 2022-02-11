/* Help from users from stackoverflow 
http://stackoverflow.com/questions/33660457/jquery-javascript-creating-a-cookie-with-toggle
*/

 function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}
// initialization
var on = getCookie("snow");
if(on == "") {
    document.cookie = "snow=true";
    snowStorm.resume();
} else {
    (on == "true") ? snowStorm.resume() : snowStorm.stop(); // If it's already running does the latter
}
  $("#Snow").click(function()
  {
	if(getCookie("snow") == "true") {
        snowStorm.stop();
        document.cookie = "snow=false";  // overwrite the cookies to change them
    } else {
        snowStorm.resume();
        document.cookie = "snow=true";
    }
 });
 
 $("#Summer").click(function(){
	 snowStorm.stop();
	 document.getElementById("Snow").disabled=true;
 });
 
 $("#Winter").click(function(){	 
	 snowStorm.stop();
	 document.getElementById("Snow").disabled=false;
 });
