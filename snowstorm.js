/*
   DHTML Snowstorm! OO-style Jascript-based Snow effect
   ----------------------------------------------------
   Version 1.4.20091115 (Previous rev: v1.3.20081215)
   Code by Scott Schiller - http://schillmania.com
   ----------------------------------------------------
  
   Initializes after body onload() by default (via addEventHandler() call at bottom.)
   To customize properties, edit below or override configuration after this script
   has run (but before body.onload), eg. snowStorm.snowStick = false;

*/

var snowStorm = null;

function SnowStorm() {

  // --- PROPERTIES ---

  this.flakesMax = 128;           // Limit total amount of snow made (falling + sticking)
  this.flakesMaxActive = 64;      // Limit amount of snow falling at once (less = lower CPU use)
  this.animationInterval = 33;    // Theoretical "miliseconds per frame" measurement. 20 = fast + smooth, but high CPU use. 50 = more conservative, but slower
  this.flakeBottom = null;        // Integer for Y axis snow limit, 0 or null for "full-screen" snow effect
  this.targetElement = null;      // element which snow will be appended to (document body if null/undefined) - can be an element ID string, or a DOM node reference
  this.followMouse = true;        // Snow will change movement with the user's mouse
  this.snowColor = '#fff';        // Don't eat (or use?) yellow snow.
  this.snowCharacter = '&bull;';  // &bull; = bullet, &middot; is square on some systems etc.
  this.snowStick = true;          // Whether or not snow should "stick" at the bottom. When off, will never collect.
  this.useMeltEffect = true;      // When recycling fallen snow (or rarely, when falling), have it "melt" and fade out if browser supports it
  this.useTwinkleEffect = false;  // Allow snow to randomly "flicker" in and out of view while falling
  this.usePositionFixed = false;  // true = snow not affected by window scroll. may increase CPU load, disabled by default - if enabled, used only where supported

  // --- less-used bits ---

  this.flakeLeftOffset = 0;       // amount to subtract from edges of container
  this.flakeRightOffset = 0;      // amount to subtract from edges of container
  this.flakeWidth = 8;            // max pixel width for snow element
  this.flakeHeight = 8;           // max pixel height for snow element
  this.vMaxX = 5;                 // Maximum X velocity range for snow
  this.vMaxY = 4;                 // Maximum Y velocity range
  this.zIndex = 0;                // CSS stacking order applied to each snowflake

  // --- End of user section ---

  // jslint global declarations
  /*global window, document, navigator, clearInterval, setInterval */

  var addEvent = (typeof(window.attachEvent)=='undefined'?function(o,evtName,evtHandler) {
	return o.addEventListener(evtName,evtHandler,false);
  }:function(o,evtName,evtHandler) {
	return o.attachEvent('on'+evtName,evtHandler);
  });

  var removeEvent = (typeof(window.attachEvent)=='undefined'?function(o,evtName,evtHandler) {
    return o.removeEventListener(evtName,evtHandler,false);
  }:function(o,evtName,evtHandler) {
	return o.detachEvent('on'+evtName,evtHandler);
  });

  function rnd(n,min) {
    if (isNaN(min)) {
	  min = 0;
	}
    return (Math.random()*n)+min;
  }

  function plusMinus(n) {
    return (parseInt(rnd(2),10)==1?n*-1:n);
  }

  var s = this;
  var storm = this;
  this.timers = [];
  this.flakes = [];
  this.disabled = false;
  this.active = false;

  var isIE = navigator.userAgent.match(/msie/i);
  var isIE6 = navigator.userAgent.match(/msie 6/i);
  var isOldIE = (isIE && (isIE6 || navigator.userAgent.match(/msie 5/i)));
  var isWin9X = navigator.appVersion.match(/windows 98/i);
  var isiPhone = navigator.userAgent.match(/iphone/i);
  var isBackCompatIE = (isIE && document.compatMode == 'BackCompat');
  var noFixed = ((isBackCompatIE || isIE6 || isiPhone)?true:false);
  var screenX = null;
  var screenX2 = null;
  var screenY = null;
  var scrollY = null;
  var vRndX = null;
  var vRndY = null;
  var windOffset = 1;
  var windMultiplier = 2;
  var flakeTypes = 6;
  var fixedForEverything = false;
  var opacitySupported = (function(){
    try {
	  document.createElement('div').style.opacity = '0.5';
    } catch (e) {
	  return false;
    }
    return true;
  })();
  var docFrag = document.createDocumentFragment();
  if (s.flakeLeftOffset === null) {
	s.flakeLeftOffset = 0;
  }
  if (s.flakeRightOffset === null) {
	s.flakeRightOffset = 0;
  }

  this.meltFrameCount = 20;
  this.meltFrames = [];
  for (var i=0; i<this.meltFrameCount; i++) {
	this.meltFrames.push(1-(i/this.meltFrameCount));
  }

  this.randomizeWind = function() {
    vRndX = plusMinus(rnd(s.vMaxX,0.2));
    vRndY = rnd(s.vMaxY,0.2);
    if (this.flakes) {
      for (var i=0; i<this.flakes.length; i++) {
        if (this.flakes[i].active) {
          this.flakes[i].setVelocities();
		}
      }
    }
  };

  this.scrollHandler = function() {
    // "attach" snowflakes to bottom of window if no absolute bottom value was given
    scrollY = (s.flakeBottom?0:parseInt(window.scrollY||document.documentElement.scrollTop||document.body.scrollTop,10));
    if (isNaN(scrollY)) {
	  scrollY = 0; // Netscape 6 scroll fix
	}
    if (!fixedForEverything && !s.flakeBottom && s.flakes) {
      for (var i=s.flakes.length; i--;) {
        if (s.flakes[i].active === 0) {
	      s.flakes[i].stick();
		}
      }
    }
  };

  this.resizeHandler = function() {
    if (window.innerWidth || window.innerHeight) {
      screenX = window.innerWidth-(!isIE?16:2)-s.flakeRightOffset;
      screenY = (s.flakeBottom?s.flakeBottom:window.innerHeight);
    } else {
      screenX = (document.documentElement.clientWidth||document.body.clientWidth||document.body.scrollWidth)-(!isIE?8:0)-s.flakeRightOffset;
      screenY = s.flakeBottom?s.flakeBottom:(document.documentElement.clientHeight||document.body.clientHeight||document.body.scrollHeight);
    }
    screenX2 = parseInt(screenX/2,10);
  };

  this.resizeHandlerAlt = function() {
    screenX = s.targetElement.offsetLeft+s.targetElement.offsetWidth-s.flakeRightOffset;
    screenY = s.flakeBottom?s.flakeBottom:s.targetElement.offsetTop+s.targetElement.offsetHeight;
    screenX2 = parseInt(screenX/2,10);
  };

  this.freeze = function() {
    // pause animation
    if (!s.disabled) {
      s.disabled = 1;
    } else {
      return false;
    }
    for (var i=s.timers.length; i--;) {
      clearInterval(s.timers[i]);
    }
  };

  this.resume = function() {
    if (s.disabled) {
       s.disabled = 0;
    } else {
      return false;
    }
    s.timerInit();
  };

  this.toggleSnow = function() {
    if (!s.flakes.length) {
      // first run
      s.start();
    } else {
      s.active = !s.active;
      if (s.active) {
        s.show();
        s.resume();
      } else {
        s.stop();
        s.freeze();
      }
    }
  };

  this.stop = function() {
    this.freeze();
    for (var i=this.flakes.length; i--;) {
      this.flakes[i].o.style.display = 'none';
    }
    removeEvent(window,'scroll',s.scrollHandler);
    removeEvent(window,'resize',s.resizeHandler);
    if (!isOldIE) {
      removeEvent(window,'blur',s.freeze);
      removeEvent(window,'focus',s.resume);
    }
  };

  this.show = function() {
    for (var i=this.flakes.length; i--;) {
      this.flakes[i].o.style.display = 'block';
    }
  };

  this.SnowFlake = function(parent,type,x,y) {
    var s = this;
    var storm = parent;
    this.type = type;
    this.x = x||parseInt(rnd(screenX-20),10);
    this.y = (!isNaN(y)?y:-rnd(screenY)-12);
    this.vX = null;
    this.vY = null;
    this.vAmpTypes = [1,1.2,1.4,1.6,1.8]; // "amplification" for vX/vY (based on flake size/type)
    this.vAmp = this.vAmpTypes[this.type];
    this.melting = false;
    this.meltFrameCount = storm.meltFrameCount;
    this.meltFrames = storm.meltFrames;
    this.meltFrame = 0;
    this.twinkleFrame = 0;
    this.active = 1;
    this.fontSize = (10+(this.type/5)*10);
    this.o = document.createElement('div');
    this.o.innerHTML = storm.snowCharacter;
    this.o.style.color = storm.snowColor;
    this.o.style.position = (fixedForEverything?'fixed':'absolute');
    this.o.style.width = storm.flakeWidth+'px';
    this.o.style.height = storm.flakeHeight+'px';
    this.o.style.fontFamily = 'arial,verdana';
    this.o.style.overflow = 'hidden';
    this.o.style.fontWeight = 'normal';
    this.o.style.zIndex = storm.zIndex;
    docFrag.appendChild(this.o);

    this.refresh = function() {
	  if (isNaN(s.x) || isNaN(s.y)) {
		// safety check
		return false;
	  }
      s.o.style.left = s.x+'px';
      s.o.style.top = s.y+'px';
    };

    this.stick = function() {
      if (noFixed || (storm.targetElement != document.documentElement && storm.targetElement != document.body)) {
        s.o.style.top = (screenY+scrollY-storm.flakeHeight)+'px';
      } else if (storm.flakeBottom) {
	    s.o.style.top = storm.flakeBottom+'px';
	  } else {
        s.o.style.display = 'none';
	    s.o.style.top = 'auto';
        s.o.style.bottom = '0px';
	    s.o.style.position = 'fixed';
        s.o.style.display = 'block';
      }
    };

    this.vCheck = function() {
      if (s.vX>=0 && s.vX<0.2) {
        s.vX = 0.2;
      } else if (s.vX<0 && s.vX>-0.2) {
        s.vX = -0.2;
      }
      if (s.vY>=0 && s.vY<0.2) {
        s.vY = 0.2;
      }
    };

    this.move = function() {
      var vX = s.vX*windOffset;
      s.x += vX;
      s.y += (s.vY*s.vAmp);
      if (s.x >= screenX || screenX-s.x < storm.flakeWidth) { // X-axis scroll check
        s.x = 0;
      } else if (vX < 0 && s.x-storm.flakeLeftOffset<0-storm.flakeWidth) {
        s.x = screenX-storm.flakeWidth-1; // flakeWidth;
      }
      s.refresh();
      var yDiff = screenY+scrollY-s.y;
      if (yDiff<storm.flakeHeight) {
        s.active = 0;
	    if (storm.snowStick) {
          s.stick();
	    } else {
	      s.recycle();
	    }
      } else {
	    if (storm.useMeltEffect && s.active && s.type < 3 && !s.melting && Math.random()>0.998) {
	      // ~1/1000 chance of melting mid-air, with each frame
	      s.melting = true;
	      s.melt();
	      // only incrementally melt one frame
	      // s.melting = false;
	    }
	    if (storm.useTwinkleEffect) {
		  if (!s.twinkleFrame) {
			if (Math.random()>0.9) {
		      s.twinkleFrame = parseInt(Math.random()*20,10);
		    }
		  } else {
			s.twinkleFrame--;
			s.o.style.visibility = (s.twinkleFrame && s.twinkleFrame%2===0?'hidden':'visible');
		  }
	    }
      }
    };

    this.animate = function() {
      // main animation loop
      // move, check status, die etc.
      s.move();
    };

    this.setVelocities = function() {
      s.vX = vRndX+rnd(storm.vMaxX*0.12,0.1);
      s.vY = vRndY+rnd(storm.vMaxY*0.12,0.1);
    };

	this.setOpacity = function(o,opacity) {
	  if (!opacitySupported) {
		return false;
	  }
	  o.style.opacity = opacity;
	};

    this.melt = function() {
	  if (!storm.useMeltEffect || !s.melting) {
		s.recycle();
	  } else {
		if (s.meltFrame < s.meltFrameCount) {
		  s.meltFrame++;
		  s.setOpacity(s.o,s.meltFrames[s.meltFrame]);
		  s.o.style.fontSize = s.fontSize-(s.fontSize*(s.meltFrame/s.meltFrameCount))+'px';
		  s.o.style.lineHeight = storm.flakeHeight+2+(storm.flakeHeight*0.75*(s.meltFrame/s.meltFrameCount))+'px';
		} else {
		  s.recycle();
		}
	  }
    };

    this.recycle = function() {
      s.o.style.display = 'none';
      s.o.style.position = (fixedForEverything?'fixed':'absolute');
      s.o.style.bottom = 'auto';
      s.setVelocities();
      s.vCheck();
	  s.meltFrame = 0;
	  s.melting = false;
	  s.setOpacity(s.o,1);
	  s.o.style.padding = '0px';
	  s.o.style.margin = '0px';
	  s.o.style.fontSize = s.fontSize+'px';
	  s.o.style.lineHeight = (storm.flakeHeight+2)+'px';
	  s.o.style.textAlign = 'center';
	  s.o.style.verticalAlign = 'baseline';
      s.x = parseInt(rnd(screenX-storm.flakeWidth-20),10);
      s.y = parseInt(rnd(screenY)*-1,10)-storm.flakeHeight;
      s.refresh();
      s.o.style.display = 'block';
      s.active = 1;
    };

    this.recycle(); // set up x/y coords etc.
    this.refresh();

  };

  this.snow = function() {
    var active = 0;
    var used = 0;
    var waiting = 0;
    var flake = null;
    for (var i=s.flakes.length; i--;) {
      if (s.flakes[i].active == 1) {
        s.flakes[i].move();
        active++;
      } else if (s.flakes[i].active === 0) {
        used++;
      } else {
        waiting++;
      }
      if (s.flakes[i].melting) {
	    s.flakes[i].melt();
	  }
    }
    if (active<s.flakesMaxActive) {
      flake = s.flakes[parseInt(rnd(s.flakes.length),10)];
      if (flake.active === 0) {
        flake.melting = true;
      }
    }
  };

  this.mouseMove = function(e) {
    if (!s.followMouse) {
	  return true;
	}
    var x = parseInt(e.clientX,10);
    if (x<screenX2) {
      windOffset = -windMultiplier+(x/screenX2*windMultiplier);
    } else {
      x -= screenX2;
      windOffset = (x/screenX2)*windMultiplier;
    }
  };

  this.createSnow = function(limit,allowInactive) {
    for (var i=0; i<limit; i++) {
      s.flakes[s.flakes.length] = new s.SnowFlake(s,parseInt(rnd(flakeTypes),10));
      if (allowInactive || i>s.flakesMaxActive) {
	    s.flakes[s.flakes.length-1].active = -1;
	  }
    }
    storm.targetElement.appendChild(docFrag);
  };

  this.timerInit = function() {
    s.timers = (!isWin9X?[setInterval(s.snow,s.animationInterval)]:[setInterval(s.snow,s.animationInterval*3),setInterval(s.snow,s.animationInterval)]);
  };

  this.init = function() {
    s.randomizeWind();
    s.createSnow(s.flakesMax); // create initial batch
    addEvent(window,'resize',s.resizeHandler);
    addEvent(window,'scroll',s.scrollHandler);
    if (!isOldIE) {
      addEvent(window,'blur',s.freeze);
      addEvent(window,'focus',s.resume);
    }
    s.resizeHandler();
    s.scrollHandler();
    if (s.followMouse) {
      addEvent(document,'mousemove',s.mouseMove);
    }
    s.animationInterval = Math.max(20,s.animationInterval);
    s.timerInit();
  };

  var didInit = false;

  this.start = function(bFromOnLoad) {
	if (!didInit) {
	  didInit = true;
	} else if (bFromOnLoad) {
	  // already loaded and running
	  return true;
	}
    if (typeof s.targetElement == 'string') {
	  var targetID = s.targetElement;
      s.targetElement = document.getElementById(targetID);
      if (!s.targetElement) {
	    throw new Error('Snowstorm: Unable to get targetElement "'+targetID+'"');
	  }
    }
	if (!s.targetElement) {
	  s.targetElement = (!isIE?(document.documentElement?document.documentElement:document.body):document.body);
	}
    if (s.targetElement != document.documentElement && s.targetElement != document.body) {
	  s.resizeHandler = s.resizeHandlerAlt; // re-map handler to get element instead of screen dimensions
	}
    s.resizeHandler(); // get bounding box elements
    s.usePositionFixed = (s.usePositionFixed && !noFixed); // whether or not position:fixed is supported
    fixedForEverything = s.usePositionFixed;
    if (screenX && screenY && !s.disabled) {
      s.init();
      s.active = true;
    }
  };

  function doStart() {
	  s.start(true);
  }

  if (document.addEventListener) {
    // safari 3.0.4 doesn't do DOMContentLoaded, maybe others - use a fallback to be safe.
    document.addEventListener('DOMContentLoaded',doStart,false);
    window.addEventListener('load',doStart,false);
  } else {
    addEvent(window,'load',doStart);
  }

}

snowStorm = new SnowStorm();
