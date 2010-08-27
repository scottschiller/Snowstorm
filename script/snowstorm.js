// DHTML PNG Snowstorm! OO-style Jascript-based Snowstorm
// --------------------------------------------------------
// Version 1.2.20031213a
// Dependencies: png.js, addeventhandler.js
// Code by Scott Schiller - www.schillmania.com
// --------------------------------------------------------
// Description:
//
// Initializes after body onload() by default (via addEventHandler() call at bottom.)
//
// Properties:
//
// usePNG
// ---------------
// Enables PNG images if supported ("false" disables all PNG usage)
//
// flakeTypes
// ---------------
// Sets the range of flake images to use (eg. a value of 5
// will use images ranging from 0.png to 4.png.)
//
// flakesMax
// ---------------
// Sets the maximum number of snowflakes that can exist on
// the screen at any given time.
// 
// flakesMaxActive
// ---------------
// Sets the limit of "falling" snowflakes (ie. moving, thus
// considered to be "active".)
//
// vMax
// ---------------
// Defines the maximum X and Y velocities for the storm.
// A range up to this value is selected at random.
//
// flakeWidth
// ---------------
// The width (in pixels) of each snowflake image.
//
// flakeHeight
// ---------------
// Height (pixels) of each snowflake image.
// 
// flakeBottom
// ---------------
// Limits the "bottom" coordinate of the snow.
//
// snowCollect
// ---------------
// Enables snow to pile up (slowly) at bottom of window.
// Can be very CPU/resource-intensive over time.


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
  var flakeTypes = 6;
  var flakesMax = 128;
  var flakesMaxActive = 64;
  var vMax = 2.5;
  var flakeWidth = 5;
  var flakeHeight = 5;
  var flakeBottom = null; // Integer for fixed bottom, 0 or null for "full-screen" snow effect
  var snowCollect = true;

  // --- End of user section ---

  var isIE = (navigator.appName.toLowerCase().indexOf('internet explorer')+1);
  var isWin9X = (navigator.appVersion.toLowerCase().indexOf('windows 98')+1);
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
    this.o.src = 'image/snow/'+this.type+(pngHandler.transform && usePNG?'.png':'.gif');
    document.body.appendChild(this.o);
    if (pngHandler.transform && usePNG) pngHandler.transform(this.o);

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
      this.createSnow(flakesMaxActive*2,true);
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
    for (var i=0; i<limit; i++) {
      this.flakes[this.flakes.length] = new this.SnowFlake(this,parseInt(rnd(flakeTypes)));
      if (allowInactive || i>flakesMaxActive) this.flakes[this.flakes.length-1].active = -1;
    }
  }

  this.timerInit = function() {
    this.timers = (!isWin9X?setInterval("snowStorm.snow()",20):[setInterval("snowStorm.snow()",75),setInterval("snowStorm.snow()",25)]);
  }

  this.init = function() {
    for (var i=0; i<8192; i++) {
      this.terrain[i] = 0;
    }
    this.randomizeWind();
    this.createSnow(snowCollect?flakesMax:flakesMaxActive*2); // create initial batch
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

addEventHandler(window,'load',snowStormInit,false);
