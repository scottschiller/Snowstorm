// DHTML PNG Snowstorm! OO-style Jascript-based Snowstorm
// --------------------------------------------------------
// Version 1.1.20031206c
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


var snowStorm = null;

function SnowStorm() {
  var s = this;
  this.timers = [];
  this.flakes = [];
  this.disabled = false;

  // User-configurable variables
  // ---------------------------

  var usePNG = true;
  var flakeTypes = 6;
  var flakesMax = 48;
  var flakesMaxActive = 16;
  var vMax = 3;
  var flakeWidth = 5;
  var flakeHeight = 5;
  var flakeBottom = null; // Integer for fixed bottom, 0 or null for "full-screen" snow effect

  // --- End of user section ---

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
    screenX = document.documentElement.clientWidth||document.body.clientWidth||window.innerWidth;
    screenY = flakeBottom?flakeBottom:(document.documentElement.clientHeight||document.body.clientHeight||window.innerHeight);
    s.scrollHandler();
  }

  this.scrollHandler = function() {
    // "attach" snowflakes to bottom of window if no absolute bottom value was given
    scrollY = parseInt(document.documentElement.scrollTop||window.scrollY||document.body.scrollTop);
    if (!flakeBottom && s.flakes) {
      for (var i=0; i<s.flakes.length; i++) {
        if (!s.flakes[i].active) s.flakes[i].stick();
      }
    }
  }

  this.stop = function() {
    if (!this.disabled) {
      this.disabled = 1;
    } else {
      return false;
    }
    if (!isWin9X) {
      clearInterval(this.timers);
    } else {
      for (var i=0; i<this.timers.length; i++) {
        clearInterval(this.timers[i]);
      }
    }
    for (var i=0; i<this.flakes.length; i++) {
      this.flakes[i].o.style.display = 'none';
    }
    removeEventHandler(window,'scroll',this.scrollHandler,false);
  }

  this.SnowFlake = function(type,x,y) {
    var s = this;
    this.type = type;
    this.x = x||parseInt(rnd(screenX-12));
    this.y = (!isNaN(y)?y:-12);
    this.vX = null;
    this.vY = null;

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
      s.o.style.top = (screenY+scrollY-flakeHeight)+'px';
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
      this.y += this.vY;
      this.refresh();

      if (this.vX && screenX-this.x<flakeWidth+this.vX) { // X-axis scroll check
        this.x = 0;
      } else if (this.vX<0 && this.x<0-flakeWidth) {
        this.x = screenX-flakeWidth; // flakeWidth;
      }
      if ((screenY+scrollY)-this.y<flakeHeight) {
        this.active = 0;
        this.o.style.left = (this.x/screenX*100)+'%'; // set "relative" left (change with resize)
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
    for (var i=this.flakes.length-1; i>0; i--) {
      if (this.flakes[i].active) {
        this.flakes[i].animate();
        active++;
      }
    }
    if (active<flakesMaxActive && this.flakes.length<flakesMax && parseInt(rnd(2))==1) {
      this.flakes[this.flakes.length] = new this.SnowFlake(parseInt(rnd(12)));
    } else if (active<flakesMaxActive && this.flakes.length>=flakesMax) {
      with (this.flakes[parseInt(rnd(this.flakes.length))]) {
        if (!active) recycle();
      }
    }

  }

  this.init = function() {
    this.randomizeWind();
    for (var i=0; i<flakesMax; i++) {
      this.flakes[this.flakes.length] = new this.SnowFlake(parseInt(rnd(flakeTypes)));
    }
    this.timers = (!isWin9X?setInterval("snowStorm.snow()",20):[setInterval("snowStorm.snow()",75),setInterval("snowStorm.snow()",25)]);
    addEventHandler(window,'resize',this.resizeHandler,false);
    addEventHandler(window,'scroll',this.scrollHandler,false);
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
