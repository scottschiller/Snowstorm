/** @license
 * DHTML Snowstorm! JavaScript-based Snow for web pages
 * --------------------------------------------------------
 * Version 1.41.20101113 (Previous rev: 1.4.20091115)
 * Copyright (c) 2007, Scott Schiller. All rights reserved.
 * Code provided under the BSD License:
 * http://schillmania.com/projects/snowstorm/license.txt
 */

/*global window, document, navigator, clearInterval, setInterval */
/*jslint white: false, onevar: true, plusplus: false, undef: true, nomen: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true */

var snowStorm = (function(window, document) {

  // --- common properties ---

  this.flakesMax = 128;           // Limit total amount of snow made (falling + sticking)
  this.flakesMaxActive = 64;      // Limit amount of snow falling at once (less = lower CPU use)
  this.animationInterval = 33;    // Theoretical "miliseconds per frame" measurement. 20 = fast + smooth, but high CPU use. 50 = more conservative, but slower
  this.excludeMobile = true;      // Snow is likely to be bad news for mobile phones' CPUs (and batteries.) By default, be nice.
  this.flakeBottom = null;        // Integer for Y axis snow limit, 0 or null for "full-screen" snow effect
  this.followMouse = true;        // Snow movement can respond to the user's mouse
  this.snowColor = '#fff';        // Don't eat (or use?) yellow snow.
  this.snowCharacter = '&bull;';  // &bull; = bullet, &middot; is square on some systems etc.
  this.snowStick = true;          // Whether or not snow should "stick" at the bottom. When off, will never collect.
  this.targetElement = null;      // element which snow will be appended to (null = document.body) - can be an element ID eg. 'myDiv', or a DOM node reference
  this.useMeltEffect = true;      // When recycling fallen snow (or rarely, when falling), have it "melt" and fade out if browser supports it
  this.useTwinkleEffect = false;  // Allow snow to randomly "flicker" in and out of view while falling
  this.usePositionFixed = false;  // true = snow does not shift vertically when scrolling. May increase CPU load, disabled by default - if enabled, used only where supported

  // --- less-used bits ---

  this.freezeOnBlur = true;       // Only snow when the window is in focus (foreground.) Saves CPU.
  this.flakeLeftOffset = 0;       // Left margin/gutter space on edge of container (eg. browser window.) Bump up these values if seeing horizontal scrollbars.
  this.flakeRightOffset = 0;      // Right margin/gutter space on edge of container
  this.flakeWidth = 15;           // Max pixel width reserved for snow element
  this.flakeHeight = 15;          // Max pixel height reserved for snow element
  this.vMaxX = 3;                 // Maximum X velocity range for snow
  this.vMaxY = 2;                 // Maximum Y velocity range for snow
  this.zIndex = 0;                // CSS stacking order applied to each snowflake

  // --- experimental web font + CSS transform bits ---

  /**
   * WARNING: These features may not be supported in all browsers.
   * They may also cause really high CPU use; here be dragons, etc. Tread carefully.
   */

  // Web font rendering may not be awesome (esp. if font smoothing is off), etc.

  this.useWebFont = true;         // (if supported by browser) use embedded EOT/TTF/WOFF font file for real snowflake characters

  // CSS transforms may be very CPU-heavy if not hardware-accelerated.

  this.use2DRotate = true;        // (if supported by browser) 2D CSS transforms: rotating snow
  this.use3DRotate = true;        // (if supported by browser) additional 3D CSS transform effect

  this.webFontCharacters = ['%','\'','(','1','7','p','v','w','y','z']; // characters for webflakes font (EOT/TTF/WOFF)
  this.webFontCharactersSubset = ['%','\'']; // if 2D/3D transforms enabled, may be too slow without hardware acceleration - use these simpler glyphs, lower CPU

  if (!navigator.userAgent.match(/safari/i)) {
    // "&" character glyph doesn't work in Safari?
    this.webFontCharacters.push('&');
    this.webFontCharactersSubset.push('&');
  }

  // --- End of user section ---

  var s = this, storm = this, i, head, css, cssLink, cssText, text, node,
  // UA sniffing and backCompat rendering mode checks for fixed position, etc.
  isIE = navigator.userAgent.match(/msie/i),
  isIE6 = navigator.userAgent.match(/msie 6/i),
  isWin98 = navigator.appVersion.match(/windows 98/i),
  isMobile = navigator.userAgent.match(/mobile/i),
  isBackCompatIE = (isIE && document.compatMode === 'BackCompat'),
  noFixed = (isMobile || isBackCompatIE || isIE6),
  screenX = null, screenX2 = null, screenY = null, scrollY = null, vRndX = null, vRndY = null,
  windOffset = 1,
  angle = 0,
  windMultiplier = 1.1,
  fixedForEverything = false,
  testDiv = document.createElement('div'),
  snowTemplate = null,
  opacitySupported = (function(){
    try {
      testDiv.style.opacity = '0.5';
    } catch(e) {
      return false;
    }
    return true;
  }()),
  didInit = false,
  transforms = {
    moz: (typeof testDiv.style.MozTransform !== 'undefined' ? 'MozTransform' : null),
    webkit: (typeof testDiv.style.webkitTransform !== 'undefined' ? 'webkitTransform' : null),
    prop: null
  },
  docFrag = document.createDocumentFragment();
  transforms.prop = (transforms.moz || transforms.webkit);

  this.timers = [];
  this.flakes = [];
  this.disabled = false;
  this.active = false;
  this.meltFrameCount = 20;
  this.meltFrames = [];
  this.types = 16;

  this.events = (function() {

    var old = (!window.addEventListener && window.attachEvent), slice = Array.prototype.slice,
    evt = {
      add: (old?'attachEvent':'addEventListener'),
      remove: (old?'detachEvent':'removeEventListener')
    };

    function getArgs(oArgs) {
      var args = slice.call(oArgs), len = args.length;
      if (old) {
        args[1] = 'on' + args[1]; // prefix
        if (len > 3) {
          args.pop(); // no capture
        }
      } else if (len === 3) {
        args.push(false);
      }
      return args;
    }

    function apply(args, sType) {
      var element = args.shift(),
          method = [evt[sType]];
      if (old) {
        element[method](args[0], args[1]);
      } else {
        element[method].apply(element, args);
      }
    }

    function addEvent() {
      apply(getArgs(arguments), 'add');
    }

    function removeEvent() {
      apply(getArgs(arguments), 'remove');
    }

    return {
      add: addEvent,
      remove: removeEvent
    };

  }());

  function rnd(n,min) {
    if (isNaN(min)) {
      min = 0;
    }
    return (Math.random()*n)+min;
  }

  function plusMinus(n) {
    return (parseInt(rnd(2),10)===1?n*-1:n);
  }

  function checkFontFace() {

    /**
     * CSS @font-face detection code: Modernizr.js library (BSD/MIT) by Faruk Ates and Paul Irish
     * http://www.modernizr.com/
     * Their code credits Diego Perini's CSS support script
     * http://javascript.nwbox.com/CSSSupport/
     */

    var sheet,
        style = document.createElement('style'),
        impl = document.implementation || { hasFeature: function() { return false; } },
        supportAtRule;

    style.type = 'text/css';
    head.insertBefore(style, head.firstChild);
    sheet = style.sheet || style.styleSheet;

    // removing it crashes IE browsers
    // head.removeChild(style);

    supportAtRule = impl.hasFeature('CSS2', '') ? function(rule) {

      if (!(sheet && rule)) {
        return false;
      }
      var result = false;
      try {
        sheet.insertRule(rule, 0);
        result = !(/unknown/i).test(sheet.cssRules[0].cssText);
        sheet.deleteRule(sheet.cssRules.length - 1);
      } catch(e) {}
      return result;

    } : function(rule) {

      if (!(sheet && rule)) {
        return false;
      }
      sheet.cssText = rule;
      return sheet.cssText.length !== 0 && !(/unknown/i).test(sheet.cssText) && sheet.cssText.replace(/\r+|\n+/g, '').indexOf(rule.split(' ')[0]) === 0;

    };

    return supportAtRule('@font-face { font-family: "font"; src: "font.ttf"; }');

  }

  function addWebFont() {

    // now we inject the CSSes (sneaky inline injection for most, external CSS file for IE.)

    /*
    var css_link = document.createElement('link');
    css_link.rel = 'stylesheet';
    css_link.type = 'text/css';
    css_link.href = 'wwflakes-webfont.css';
    head.appendChild(css_link);
    */

    css = document.createElement('style');

    text = {
      rule: "@font-face",
      value: [
        "font-family: 'WWFlakesRegular';",
        "src: url('wwflakes-webfont.eot');",
        "src: local('`'), url('wwflakes-webfont.woff') format('woff'), url('wwflakes-webfont.ttf') format('truetype');",
        "font-weight: normal;",
        "font-style: normal;"
      ]
    };

    /*
    text = {
      rule: 'body',
      value: ['color:#ff33ff']
    }
    */

    cssText = text.rule + ' {\n' + text.value.join('\n') + '\n}';

    node = document.createTextNode(cssText);

    if (!isIE) {

      css.appendChild(node);
      head.appendChild(css);

    } else {

      /*
        var count = document.styleSheets.length;
        head.appendChild(css);
        document.styleSheets[count].addRule(text.rule, text.value.join('\n'));
        // css.innerHTML = 'body { color: #ff33ff; }'; // fails
      */

      cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.type = 'text/css';
      cssLink.href = 'wwflakes-webfont.css';
      head.appendChild(cssLink);

    }

  }

  this.getSnowCharacter = function() {
    var charset = (s.useWebFont ? (s.use2DRotate ? (transforms.webkit ? s.webFontCharacters : s.webFontCharactersSubset) : s.webFontCharactersSubset) : null);
    return (!charset ? s.snowCharacter : charset[parseInt(Math.random()*charset.length,10)]);
  };

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
    s.events.remove(window,'scroll',s.scrollHandler);
    s.events.remove(window,'resize',s.resizeHandler);
    if (s.freezeOnBlur) {
      if (isIE) {
        s.events.remove(document,'focusout',s.freeze);
        s.events.remove(document,'focusin',s.resume);
      } else {
        s.events.remove(window,'blur',s.freeze);
        s.events.remove(window,'focus',s.resume);
      }
    }
  };

  this.show = function() {
    for (var i=this.flakes.length; i--;) {
      this.flakes[i].o.style.display = 'block';
    }
  };

  this.SnowFlake = function(parent,type,x,y) {
    var s = this, storm = parent, style = [];
    this.type = type;
    this.x = x||parseInt(rnd(screenX-20),10);
    this.y = (!isNaN(y)?y:-rnd(screenY)-12);
    this.vX = null;
    this.vY = null;
    this.angle = 0;
    this.angleOffset = parseInt(Math.random()*360,10);
    this.angleMultiplier = plusMinus(Math.random()*2);
    this.rotateDirection = plusMinus(1+plusMinus(Math.random()*1));
    this.vAmp = 1+(0.1*this.type);
    this.melting = false;
    this.meltFrameCount = storm.meltFrameCount;
    this.meltFrames = storm.meltFrames;
    this.meltFrame = 0;
    this.twinkleFrame = 0;
    this.active = 1;
    this.fontSize = (9+(this.type/storm.types)*(storm.useWebFont?15:20));
    this.scale = Math.log(this.fontSize-6);
    this.o = snowTemplate.cloneNode(true);
    // this.o.style.outline = '1px solid rgba(255,255,255,0.5)';
    this.o.innerHTML = storm.getSnowCharacter(); // text instead?
    this.flakeWidth = parseInt(this.fontSize*(storm.useWebFont?2:1),10); // s.o.offsetWidth;
    this.flakeHeight = parseInt(this.fontSize*(storm.useWebFont?1:1),10); // s.o.offsetHeight;
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
      if (noFixed || (storm.targetElement !== document.documentElement && storm.targetElement !== document.body)) {
        s.o.style.top = (screenY+scrollY-s.flakeHeight)+'px';
      } else if (storm.flakeBottom) {
        s.o.style.top = storm.flakeBottom+'px';
      } else {
        s.o.style.display = 'none';
        s.o.style.top = 'auto';
        s.o.style.bottom = '0px';
        s.o.style.position = 'fixed';
        s.o.style.display = 'block';
//        s.o.style.lineHeight = '100%';
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

    this.applyAngle = function(angle) {
      if (storm.use2DRotate && s.y >= -s.flakeHeight && (transforms.webkit || this.fontSize >= 14)) {
        var angle2 = Math.abs(Math.min(3,s.angleOffset+(angle*s.angleMultiplier)));
        if (!storm.use3DRotate || !transforms.webkit) {
          style.push('rotate('+angle+'deg)');
        } else {
          style.push('rotate('+angle+'deg) rotate3D(0,1,0,'+angle2+'deg)'); // should be hardware-accelerated // s.angleOffset+(angle*s.angleMultiplier)
        }
        s.o.style[transforms.prop] = style.join(' ');
        style = [];
      }
    };

    this.move = function() {
      var vX = s.vX*(windOffset*s.scale), yDiff;
      s.x += vX;
      s.y += (s.vY*s.vAmp);
      if (s.x >= screenX || screenX-s.x < s.flakeWidth) { // X-axis scroll check
        s.x = 0;
      } else if (vX < 0 && s.x-storm.flakeLeftOffset < 0-s.flakeWidth) {
        s.x = screenX-s.flakeWidth-1; // flakeWidth;
      }
      if (storm.use2DRotate && transforms.prop) {
        s.angle += (5 * windOffset * s.rotateDirection);
        if (Math.max(s.angle) >= 360) {
          s.angle = 0;
        }
        s.applyAngle(s.angle);
      }
      s.refresh();
      yDiff = screenY + scrollY - s.y - (storm.useWebFont ? 3 : 0);
      if (yDiff <= s.flakeHeight) {
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
      s.vX = vRndX+rnd(storm.vMaxX*0.2,0.1);
      s.vY = vRndY+rnd(storm.vMaxY*0.2,0.1);
    };

    this.setOpacity = function(o,opacity) {
      if (opacitySupported) {
        o.style.opacity = opacity;
      }
    };

    this.melt = function() {
      if (!storm.useMeltEffect || !s.melting) {
        s.recycle();
      } else {
        if (s.meltFrame < s.meltFrameCount) {
          s.meltFrame++;
          s.setOpacity(s.o,s.meltFrames[s.meltFrame]);
          s.o.style.fontSize = s.fontSize-(s.fontSize*(s.meltFrame/s.meltFrameCount))+'px';
          // s.o.style.lineHeight = 'auto'; // s.flakeHeight+2+(s.flakeHeight*0.75*(s.meltFrame/s.meltFrameCount))+'px';
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
      // s.o.style.lineHeight = 'auto'; // (storm.flakeHeight+2)+'px';
      s.o.style.textAlign = 'center';
      s.o.style.verticalAlign = 'baseline';
      s.x = parseInt(rnd(screenX-s.flakeWidth-20),10);
      s.y = parseInt(rnd(screenY)*-1,10)-s.flakeHeight;
      s.refresh();
      s.o.style.display = 'block';
      s.active = 1;
    };

    this.recycle(); // set up x/y coords etc.
    this.refresh();

  };

  this.snow = function() {
    var active = 0, used = 0, waiting = 0, flake = null, i;
    for (i=s.flakes.length; i--;) {
      if (s.flakes[i].active === 1) {
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

  this.createTemplate = function() {
    snowTemplate = document.createElement('div');
    var o = snowTemplate.style;
    o.color = storm.snowColor;
    o.margin = '0px';
    o.padding = '0px';
    o.position = (fixedForEverything?'fixed':'absolute');
    o.fontFamily = 'WWFlakesRegular,arial,verdana,sans-serif'; // "Arial Unicode MS","Lucida Sans Unicode",
    o.display = 'block';
    o.overflow = 'hidden';
    o.fontWeight = 'normal';
    o.zIndex = storm.zIndex;
    // this.o.style.width = this.flakeWidth+'px';
    // this.o.style.height = this.flakeHeight+'px';
    // this.o.style.verticalAlign = 'bottom'; // ?
    // this.o.style.textAlign = 'center';
  };

  this.createSnow = function(limit,allowInactive) {
    for (var i=0; i<limit; i++) {
      s.flakes[s.flakes.length] = new s.SnowFlake(s,parseInt(rnd(storm.types),10));
      if (allowInactive || i>s.flakesMaxActive) {
        s.flakes[s.flakes.length-1].active = -1;
      }
    }
    storm.targetElement.appendChild(docFrag);
  };

  this.timerInit = function() {
    s.timers = (!isWin98?[setInterval(s.snow,s.animationInterval)]:[setInterval(s.snow,s.animationInterval*3),setInterval(s.snow,s.animationInterval)]);
  };

  this.init = function() {

    if (s.useWebFont) {
      if (checkFontFace()) {
        addWebFont();
      } else {
        // No support. Fall back to plain text.
        s.useWebFont = false;
        // Maybe disable rotate, too?
      }
    }

    s.createTemplate();
    for (var i=0; i<s.meltFrameCount; i++) {
      s.meltFrames.push(1-(i/s.meltFrameCount));
    }
    s.randomizeWind();
    s.createSnow(s.flakesMax); // create initial batch
    s.events.add(window,'resize',s.resizeHandler);
    s.events.add(window,'scroll',s.scrollHandler);
    if (s.freezeOnBlur) {
      if (isIE) {
        s.events.add(document,'focusout',s.freeze);
        s.events.add(document,'focusin',s.resume);
      } else {
        s.events.add(window,'blur',s.freeze);
        s.events.add(window,'focus',s.resume);
      }
    }
    s.resizeHandler();
    s.scrollHandler();
    if (s.followMouse) {
      s.events.add(isIE?document:window,'mousemove',s.mouseMove);
    }
    s.animationInterval = Math.max(20,s.animationInterval);
    s.timerInit();
  };

  this.start = function(bFromOnLoad) {
    if (!didInit) {
      didInit = true;
    } else if (bFromOnLoad) {
      // already loaded and running
      return true;
    }
    if (typeof s.targetElement === 'string') {
      var targetID = s.targetElement;
      s.targetElement = document.getElementById(targetID);
      if (!s.targetElement) {
        throw new Error('Snowstorm: Unable to get targetElement "'+targetID+'"');
      }
    }
    if (!s.targetElement) {
      s.targetElement = (!isIE?(document.documentElement?document.documentElement:document.body):document.body);
    }
    if (s.targetElement !== document.documentElement && s.targetElement !== document.body) {
      s.resizeHandler = s.resizeHandlerAlt; // re-map handler to get element instead of screen dimensions
    }
    head = document.getElementsByTagName('head')[0];
    s.resizeHandler(); // get bounding box elements
    s.usePositionFixed = (s.usePositionFixed && !noFixed); // whether or not position:fixed is supported
    fixedForEverything = s.usePositionFixed;
    if (screenX && screenY && !s.disabled) {
      s.init();
      s.active = true;
    }
  };

  function doStart() {
    if ((this.excludeMobile && !isMobile) || !this.excludeMobile) {
      window.setTimeout(function() {
        s.start(true);
      }, 20);
    }
    // event cleanup
    s.events.remove(window, 'load', doStart);
  }

  // hooks for starting the snow
  s.events.add(window, 'load', doStart, false);

  return this;

}(window, document));