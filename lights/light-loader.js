// JS to load more JS

function loadScript(sURL,onLoad) {

  var loadScriptHandler = function() {
    var rs = this.readyState;
    if (rs == 'loaded' || rs == 'complete') {
      this.onreadystatechange = null;
      this.onload = null;
      window.setTimeout(onLoad,20);
    }
  }

  function scriptOnload() {
    this.onreadystatechange = null;
    this.onload = null;
    window.setTimeout(onLoad,20);
  }

  var oS = document.createElement('script');
  oS.type = 'text/javascript';

  if (onLoad) {
    oS.onreadystatechange = loadScriptHandler;
    oS.onload = scriptOnload;
  }

  oS.src = sURL;
  document.getElementsByTagName('head')[0].appendChild(oS);

}

/*
<script src="lights/soundmanager2-nodebug-jsmin.js"></script>
<script src="http://yui.yahooapis.com/combo?2.6.0/build/yahoo-dom-event/yahoo-dom-event.js&2.6.0/build/animation/animation-min.js"></script>
<script src="lights/christmaslights.js"></script>
*/

window.SM2_DEFER = true;

window.onload = function() {

  loadScript('http://yui.yahooapis.com/combo?2.6.0/build/yahoo-dom-event/yahoo-dom-event.js&2.6.0/build/animation/animation-min.js', function() {
    loadScript('lights/soundmanager2-nodebug-jsmin.js', function() {
      window.soundManager = new SoundManager();
      loadScript('lights/christmaslights.js', function() {
        soundManager.beginDelayedInit();
      });
    });
  });

}