/*
   DHTML PNG Snowstorm! OO-style Jascript-based Snow effect
   --------------------------------------------------------
   Version 1.2.20041121a
   Dependencies: GIF/PNG images (0 through 4.gif/png)
   Code by Scott Schiller - www.schillmania.com
   --------------------------------------------------------
   Description:
  
   Initializes after body onload() by default (via addEventHandler() call at bottom.)
  
   Properties:
  
   usePNG
   ---------------
   Enables PNG images if supported ("false" disables all PNG usage)
  
   flakeTypes
   ---------------
   Sets the range of flake images to use (eg. a value of 5
   will use images ranging from 0.png to 4.png.)
  
   flakesMax
   ---------------
   Sets the maximum number of snowflakes that can exist on
   the screen at any given time.
   
   flakesMaxActive
   ---------------
   Sets the limit of "falling" snowflakes (ie. moving, thus
   considered to be "active".)
  
   vMax
   ---------------
   Defines the maximum X and Y velocities for the storm.
   A range up to this value is selected at random.
  
   flakeWidth
   ---------------
   The width (in pixels) of each snowflake image.
  
   flakeHeight
   ---------------
   Height (pixels) of each snowflake image.
   
   flakeBottom
   ---------------
   Limits the "bottom" coordinate of the snow.
  
   snowCollect
   ---------------
   Enables snow to pile up (slowly) at bottom of window.
   Can be very CPU/resource-intensive over time.

*/

var snowStorm = null;

function SnowStorm() {
  var s = this;
  var storm = this;
  this.timers = [];
  this.flakes = [];
  this.disabled = false;
  this.terrain = [];

  // User-configurable variables
  // ---------------------------

  var usePNG = true;
  var imagePath = 'image/snow/'; // relative path to snow images
  var flakeTypes = 6;
  var flakesMax = 128;
  var flakesMaxActive = 64;
  var vMax = 2.5;
  var flakeWidth = 5;
  var flakeHeight = 5;
  var flakeBottom = null; // Integer for fixed bottom, 0 or null for "full-screen" snow effect
  var snowCollect = true;
  var showStatus = true;

  // --- End of user section ---

  var isIE = (navigator.appName.toLowerCase().indexOf('internet explorer')+1);
  var isWin9X = (navigator.appVersion.toLowerCase().indexOf('windows 98')+1);
  var isOpera = (navigator.userAgent.toLowerCase().indexOf('opera ')+1 || navigator.userAgent.toLowerCase().indexOf('opera/')+1);
  if (isOpera) isIE = false; // Opera (which is sneaky, pretending to be IE by default)
  var screenX = null;
  var screenY = null;
  var scrollY = null;
  var vRndX = null;
  var vRndY = null;

  function rnd(n,min) {
    if (isNaN(min)) min = 0;
    return (Math.random()*n)+min;
  }

  this.randomizeWind = function() {
    vRndX = plusMinus(rnd(vMax,0.2));
    vRndY = rnd(vMax,0.2);
    if (this.flakes) {
      for (var i=0; i<this.flakes.length; i++) {
        if (this.flakes[i].active) this.flakes[i].setVelocities();
      }
    }
  }

  function plusMinus(n) {
    return (parseInt(rnd(2))==1?n*-1:n);
  }

  this.resizeHandler = function() {
    if (window.innerWidth || window.innerHeight) {
      screenX = window.innerWidth-(!isIE?24:2);
      screenY = (flakeBottom?flakeBottom:window.innerHeight);
    } else {
      screenX = (document.documentElement.clientWidth||document.body.clientWidth||document.body.scrollWidth)-(!isIE?8:0);
      screenY = flakeBottom?flakeBottom:(document.documentElement.clientHeight||document.body.clientHeight||document.body.scrollHeight);
    }
    s.scrollHandler();
  }

  this.scrollHandler = function() {
    // "attach" snowflakes to bottom of window if no absolute bottom value was given
    scrollY = (flakeBottom?0:parseInt(window.scrollY||document.documentElement.scrollTop||document.body.scrollTop));
    if (isNaN(scrollY)) scrollY = 0; // Netscape 6 scroll fix
    if (!flakeBottom && s.flakes) {
      for (var i=0; i<s.flakes.length; i++) {
        if (s.flakes[i].active == 0) s.flakes[i].stick();
      }
    }
  }

  this.freeze = function() {
    // pause animation
    if (!s.disabled) {
      s.disabled = 1;
    } else {
      return false;
    }
    if (!isWin9X) {
      clearInterval(s.timers);
    } else {
      for (var i=0; i<s.timers.length; i++) {
        clearInterval(s.timers[i]);
      }
    }
  }

  this.resume = function() {
    if (s.disabled) {
       s.disabled = 0;
    } else {
      return false;
    }
    s.timerInit();
  }

  this.stop = function() {
    this.freeze();
    for (var i=0; i<this.flakes.length; i++) {
      this.flakes[i].o.style.display = 'none';
    }
    removeEventHandler(window,'scroll',this.scrollHandler,false);
    removeEventHandler(window,'resize',this.resizeHandler,false);
  }

  this.SnowFlake = function(parent,type,x,y) {
    var s = this;
    var storm = parent;
    this.type = type;
    this.x = x||parseInt(rnd(screenX-12));
    this.y = (!isNaN(y)?y:-12);
    this.vX = null;
    this.vY = null;
    this.vAmpTypes = [2.0,1.0,1.25,1.0,1.5,1.75]; // "amplification" for vX/vY (based on flake size/type)
    this.vAmp = this.vAmpTypes[this.type];

    this.active = 1;
    this.o = document.createElement('img');
    this.o.style.position = 'absolute';
    this.o.style.width = flakeWidth+'px';
    this.o.style.height = flakeHeight+'px';
    this.o.style.fontSize = '1px'; // so IE keeps proper size
    this.o.style.zIndex = 2;
    this.o.src = imagePath+this.type+(pngHandler.supported && usePNG?'.png':'.gif');
    document.body.appendChild(this.o);
    if (pngHandler.supported && usePNG) pngHandler.transform(this.o);

    this.refresh = function() {
      this.o.style.left = this.x+'px';
      this.o.style.top = this.y+'px';
    }

    this.stick = function() {
      s.o.style.top = (screenY+scrollY-flakeHeight-storm.terrain[Math.floor(this.x)])+'px';
      // called after relative left has been called
    }

    this.vCheck = function() {
      if (this.vX>=0 && this.vX<0.2) {
        this.vX = 0.2;
      } else if (this.vX<0 && this.vX>-0.2) {
        this.vX = -0.2;
      }
      if (this.vY>=0 && this.vY<0.2) {
        this.vY = 0.2;
      }
    }

    this.move = function() {
      this.x += this.vX;
      this.y += (this.vY*this.vAmp);
      this.refresh();

      if (this.vX && screenX-this.x<flakeWidth+this.vX) { // X-axis scroll check
        this.x = 0;
      } else if (this.vX<0 && this.x<0-flakeWidth) {
        this.x = screenX-flakeWidth; // flakeWidth;
      }
      var yDiff = screenY+scrollY-this.y-storm.terrain[Math.floor(this.x)];
      if (yDiff<flakeHeight) {
        this.active = 0;
        if (snowCollect) {
          var height = [0.75,1.5,0.75];
          for (var i=0; i<2; i++) {
            storm.terrain[Math.floor(this.x)+i+2] += height[i];
          }
        }
        this.o.style.left = ((this.x-(!isIE?flakeWidth:0))/screenX*100)+'%'; // set "relative" left (change with resize)
        if (!flakeBottom) {
          this.stick();
        }
      }
    }

    this.animate = function() {
      // main animation loop
      // move, check status, die etc.
      this.move();
    }

    this.setVelocities = function() {
      this.vX = vRndX+rnd(vMax*0.12,0.1);
      this.vY = vRndY+rnd(vMax*0.12,0.1);
    }

    this.recycle = function() {
      this.setVelocities();
      this.vCheck();
      this.x = parseInt(rnd(screenX-flakeWidth-1));
      this.y = parseInt(rnd(640)*-1)-flakeHeight;
      this.active = 1;
    }

    this.recycle(); // set up x/y coords etc.
    this.refresh();

  }

  this.snow = function() {
    var active = 0;
    var used = 0;
    var waiting = 0;
    for (var i=this.flakes.length-1; i>0; i--) {
      if (this.flakes[i].active == 1) {
        this.flakes[i].animate();
        active++;
      } else if (this.flakes[i].active == 0) {
        used++;
      } else {
        waiting++;
      }
    }
    if (snowCollect && !waiting) { // !active && !waiting
      // create another batch of snow
      this.createSnow(flakesMaxActive,true);
    }
    if (active<flakesMaxActive) {
      with (this.flakes[parseInt(rnd(this.flakes.length))]) {
        if (!snowCollect && active == 0) {
          recycle();
        } else if (active == -1) {
          active = 1;
        }
      }
    }
  }

  this.createSnow = function(limit,allowInactive) {
    if (showStatus) window.status = 'Creating snow...';
    for (var i=0; i<limit; i++) {
      this.flakes[this.flakes.length] = new this.SnowFlake(this,parseInt(rnd(flakeTypes)));
      if (allowInactive || i>flakesMaxActive) this.flakes[this.flakes.length-1].active = -1;
    }
    if (showStatus) window.status = '';
  }

  this.timerInit = function() {
    this.timers = (!isWin9X?setInterval("snowStorm.snow()",20):[setInterval("snowStorm.snow()",75),setInterval("snowStorm.snow()",25)]);
  }

  this.init = function() {
    for (var i=0; i<8192; i++) {
      this.terrain[i] = 0;
    }
    this.randomizeWind();
    this.createSnow(snowCollect?flakesMaxActive:flakesMaxActive*2); // create initial batch
    addEventHandler(window,'resize',this.resizeHandler,false);
    addEventHandler(window,'scroll',this.scrollHandler,false);
    // addEventHandler(window,'scroll',this.resume,false); // scroll does not cause window focus. (odd)
    // addEventHandler(window,'blur',this.freeze,false);
    // addEventHandler(window,'focus',this.resume,false);
    this.timerInit();
  }

  this.resizeHandler(); // get screen coordinates

  if (screenX && screenY && !this.disabled) {
    this.init();
  }

}

function snowStormInit() {
  setTimeout("snowStorm = new SnowStorm()",500);
}

// Generic addEventHandler() wrapper
// ---------------------------------
// A generic interface for adding DOM event handlers
// Version 1.2.20040404
//
// Code by Scott Schiller | schillmania.com
//
// Revision history:
// ---------------------------------
// v1.1.20031218: initial deploy
// v1.2.20040404: added post-load event check

var addEventHandler = null;
var removeEventHandler = null;

function postLoadEvent(eventType) {
  // test for adding an event to the body (which has already loaded) - if so, fire immediately
  return ((eventType.toLowerCase().indexOf('load')>=0) && document.body);
}

function addEventHandlerDOM(o,eventType,eventHandler,eventBubble) {
  if (!postLoadEvent(eventType)) {
    o.addEventListener(eventType,eventHandler,eventBubble);
  } else {
    eventHandler();
  }
}

function removeEventHandlerDOM(o,eventType,eventHandler,eventBubble) {
  o.removeEventListener(eventType,eventHandler,eventBubble);
}
  
function addEventHandlerIE(o,eventType,eventHandler) { // IE workaround
  if (!eventType.indexOf('on')+1) eventType = 'on'+eventType;
  if (!postLoadEvent(eventType)) {
    o.attachEvent(eventType,eventHandler); // Note addition of "on" to event type
  } else {
    eventHandler();
  }
}
  
function removeEventHandlerIE(o,eventType,eventHandler) {
  if (!eventType.indexOf('on')+1) eventType = 'on'+eventType;
  o.detachEvent(eventType,eventHandler);
}

function addEventHandlerOpera(o,eventType,eventHandler,eventBubble) {
  if (!postLoadEvent(eventType)) {
    (o==window?document:o).addEventListener(eventType,eventHandler,eventBubble);
  } else {
    eventHandler();
  }
}

function removeEventHandlerOpera(o,eventType,eventHandler,eventBubble) {
  (o==window?document:o).removeEventListener(eventType,eventHandler,eventBubble);
}

if (navigator.userAgent.toLowerCase().indexOf('opera ')+1 || navigator.userAgent.toLowerCase().indexOf('opera/')+1) {
  // opera is dumb at times.
  addEventHandler = addEventHandlerOpera;
  removeEventHandler = removeEventHandlerOpera;
} else if (document.addEventListener) { // DOM event handler method
  addEventHandler = addEventHandlerDOM;
  removeEventHandler = removeEventHandlerDOM;
} else if (document.attachEvent) { // IE event handler method
  addEventHandler = addEventHandlerIE;
  removeEventHandler = removeEventHandlerIE;
} else { // Neither "DOM level 2" (?) methods supported
  addEventHandler = function(o,eventType,eventHandler,eventBubble) {
    o['on'+eventType] = eventHandler;
    // Multiple events could be added here via array etc.
  }
  removeEventHandler = function(o,eventType,eventHandler,eventBubble) {}
}

// Safari 1.0 does not support window.scroll events - apparently netscape 6.0/6.2 and mozilla 1.4 also.
// Refer to events support table at http://www.quirksmode.org/js/events_compinfo.html

// -- end addEventHandler definition --

/*
   PNGHandler: Object-Oriented Javascript-based PNG wrapper
   --------------------------------------------------------
   Version 1.2.20040803
   Code by Scott Schiller - www.schillmania.com
   --------------------------------------------------------
   Description:
   Provides gracefully-degrading PNG functionality where
   PNG is supported natively or via filters (Damn you, IE!)
   Should work with PNGs as images and DIV background images.
   --------------------------------------------------------
   Revision history
   --------------------------------------------------------
   1.2
   - Added refresh() for changing PNG images under IE
   - Class extension: "scale" causes PNG to scale under IE
   --------------------------------------------------------
   Known bugs
   --------------------------------------------------------
   - ie:mac doesn't support PNG background images.
   - Safari doesn't support currentStyle() - can't parse BG
     via CSS (ie. for a DIV with a PNG background by class)

*/

function PNGHandler() {
  var self = this;

  this.na = navigator.appName.toLowerCase();
  this.nv = navigator.appVersion.toLowerCase();
  this.isIE = this.na.indexOf('internet explorer')+1?1:0;
  this.isWin = this.nv.indexOf('windows')+1?1:0;
  this.isIEMac = (this.isIE&&!this.isWin);
  this.isIEWin = (this.isIE&&this.isWin);
  this.ver = this.isIE?parseFloat(this.nv.split('msie ')[1]):parseFloat(this.nv);
  this.isMac = this.nv.indexOf('mac')+1?1:0;
  this.isOpera = (navigator.userAgent.toLowerCase().indexOf('opera ')+1 || navigator.userAgent.toLowerCase().indexOf('opera/')+1);
  if (this.isOpera) this.isIE = false; // Opera filter catch (which is sneaky, pretending to be IE by default)
  this.filterID = 'DXImageTransform.Microsoft.AlphaImageLoader';
  this.supported = false;
  this.transform = self.doNothing;

  this.filterMethod = function(o) {
    // IE 5.5+ proprietary filter garbage (boo!)
    // Create new element based on old one. Doesn't seem to render properly otherwise (due to filter?)
    // use DOM "currentStyle" method, so rules inherited via CSS are picked up.
    if (o.nodeName != 'IMG') {
      var b = o.currentStyle.backgroundImage.toString(); // parse out background image URL
      o.style.backgroundImage = 'none';
      // Parse out background image URL from currentStyle.
      var i1 = b.indexOf('url("')+5;
      var newSrc = b.substr(i1,b.length-i1-2).replace('.gif','.png'); // find first instance of ") after (", chop from string
      o.style.writingMode = 'lr-tb'; // Has to be applied so filter "has layout" and is displayed. Seriously. Refer to http://msdn.microsoft.com/workshop/author/filter/reference/filters/alphaimageloader.asp?frame=true
      o.style.filter = "progid:"+self.filterID+"(src='"+newSrc+"',sizingMethod='"+(o.className.indexOf('scale')+1?'scale':'crop')+"')";
    } else if (o.nodeName == 'IMG') {
      var newSrc = o.getAttribute('src').replace('.gif','.png');
      // apply filter
      o.src = 'image/none.gif'; // get rid of image
      o.style.filter = "progid:"+self.filterID+"(src='"+newSrc+"',sizingMethod="+(o.className.indexOf('scale')+1?'scale':'crop')+"')";
      o.style.writingMode = 'lr-tb'; // Has to be applied so filter "has layout" and is displayed. Seriously. Refer to http://msdn.microsoft.com/workshop/author/filter/reference/filters/alphaimageloader.asp?frame=true
    }
  }

  this.pngMethod = function(o) {
    // Native transparency support. Easy to implement. (woo!)
    bgImage = this.getBackgroundImage(o);
    if (bgImage) {
      // set background image, replacing .gif
      o.style.backgroundImage = 'url('+bgImage.replace('.gif','.png')+')';
    } else if (o.nodeName == 'IMG') {
      o.src = o.src.replace('.gif','.png');
    } else if (!bgImage) {
      // no background image
    }
  }

  this.getBackgroundImage = function(o) {
    var b, i1; // background-related variables
    var bgUrl = null;
    if (o.nodeName != 'IMG' && !(this.isIE && this.isMac)) { // ie:mac PNG support broken for DIVs with PNG backgrounds
      if (document.defaultView) {
        if (document.defaultView.getComputedStyle) {
          b = document.defaultView.getComputedStyle(o,'').getPropertyValue('background-image');
          i1 = b.indexOf('url(')+4;
          bgUrl = b.substr(i1,b.length-i1-1);
        } else {
          // no computed style
          return false;
        }
      } else {
        // no default view
        return false;
      }
    }
    return bgUrl;
  }

  this.doNothing = function() {}
  
  this.supportTest = function() {
    // Determine method to use.
    // IE 5.5+/win32: filter

    if (this.isIE && this.isWin && this.ver >= 5.5) {
      // IE proprietary filter method (via DXFilter)
      self.transform = self.filterMethod;
    } else if (!this.isIE && this.ver < 5) {
      // No PNG support or broken support
      // Leave existing content as-is
      self.transform = null;
      return false;
    } else if (!this.isIE && this.ver >= 5 || (this.isIE && this.isMac && this.ver >= 5)) { // version 5+ browser (not IE), or IE:mac 5+
      self.transform = self.pngMethod;
    } else {
      // Presumably no PNG support. GIF used instead.
      self.transform = null;
      return false;
    }
    return true;
  }

  this.init = function() {
    this.supported = this.supportTest();
  }

}

function getElementsByClassName(className,oParent) {
  var doc = (oParent||document);
  var matches = [];
  var nodes = doc.all||doc.getElementsByTagName('*');
  for (var i=0; i<nodes.length; i++) {
    if (nodes[i].className == className || nodes[i].className.indexOf(className)+1 || nodes[i].className.indexOf(className+' ')+1 || nodes[i].className.indexOf(' '+className)+1) {
      matches[matches.length] = nodes[i];
    }
  }
  return matches; // kids, don't play with fire. ;)
}

// Instantiate and initialize PNG Handler

var pngHandler = new PNGHandler();

pngHandler.init();


addEventHandler(window,'load',snowStormInit,false);
