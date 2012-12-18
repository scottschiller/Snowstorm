/** @license
 * DHTML Snowstorm! JavaScript-based Snow for web pages
 * --------------------------------------------------------
 * Version 1.43.20111201 (Previous rev: 1.42.20111120)
 * Copyright (c) 2007, Scott Schiller. All rights reserved.
 * Code provided under the BSD License:
 * http://schillmania.com/projects/snowstorm/license.txt
 */
/*global window, document, navigator, clearInterval, setInterval */
/*jslint white: false, onevar: true, plusplus: false, undef: true, nomen: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true */
function SnowStorm(a,b){function y(a,b){return isNaN(b)&&(b=0),Math.random()*a+b}function z(a){return parseInt(y(2),10)===1?a*-1:a}function A(){a.setTimeout(function(){c.start(!0)},20),c.events.remove(f?b:a,"mousemove",A)}function B(){if(!c.excludeMobile||!i)c.freezeOnBlur?c.events.add(f?b:a,"mousemove",A):A();c.events.remove(a,"load",B)}this.autoStart=!0,this.flakesMax=128,this.flakesMaxActive=64,this.animationInterval=33,this.excludeMobile=!0,this.flakeBottom=null,this.followMouse=!0,this.snowColor="#fff",this.snowCharacter="&bull;",this.snowStick=!0,this.targetElement=null,this.useMeltEffect=!0,this.useTwinkleEffect=!1,this.usePositionFixed=!1,this.freezeOnBlur=!0,this.flakeLeftOffset=0,this.flakeRightOffset=0,this.flakeWidth=8,this.flakeHeight=8,this.vMaxX=5,this.vMaxY=4,this.zIndex=0;var c=this,d=this,e,f=navigator.userAgent.match(/msie/i),g=navigator.userAgent.match(/msie 6/i),h=navigator.appVersion.match(/windows 98/i),i=navigator.userAgent.match(/mobile|opera m(ob|in)/i),j=f&&b.compatMode==="BackCompat",k=i||j||g,l=null,m=null,n=null,o=null,p=null,q=null,r=1,s=2,t=6,u=!1,v=function(){try{b.createElement("div").style.opacity="0.5"}catch(a){return!1}return!0}(),w=!1,x=b.createDocumentFragment();this.timers=[],this.flakes=[],this.disabled=!1,this.active=!1,this.meltFrameCount=20,this.meltFrames=[],this.events=function(){function e(a){var d=c.call(a),e=d.length;return b?(d[1]="on"+d[1],e>3&&d.pop()):e===3&&d.push(!1),d}function f(a,c){var e=a.shift(),f=[d[c]];b?e[f](a[0],a[1]):e[f].apply(e,a)}function g(){f(e(arguments),"add")}function h(){f(e(arguments),"remove")}var b=!a.addEventListener&&a.attachEvent,c=Array.prototype.slice,d={add:b?"attachEvent":"addEventListener",remove:b?"detachEvent":"removeEventListener"};return{add:g,remove:h}}(),this.randomizeWind=function(){var a;p=z(y(c.vMaxX,.2)),q=y(c.vMaxY,.2);if(this.flakes)for(a=0;a<this.flakes.length;a++)this.flakes[a].active&&this.flakes[a].setVelocities()},this.scrollHandler=function(){var d;o=c.flakeBottom?0:parseInt(a.scrollY||b.documentElement.scrollTop||b.body.scrollTop,10),isNaN(o)&&(o=0);if(!u&&!c.flakeBottom&&c.flakes)for(d=c.flakes.length;d--;)c.flakes[d].active===0&&c.flakes[d].stick()},this.resizeHandler=function(){a.innerWidth||a.innerHeight?(l=a.innerWidth-16-c.flakeRightOffset,n=c.flakeBottom?c.flakeBottom:a.innerHeight):(l=(b.documentElement.clientWidth||b.body.clientWidth||b.body.scrollWidth)-(f?0:8)-c.flakeRightOffset,n=c.flakeBottom?c.flakeBottom:b.documentElement.clientHeight||b.body.clientHeight||b.body.scrollHeight),m=parseInt(l/2,10)},this.resizeHandlerAlt=function(){l=c.targetElement.offsetLeft+c.targetElement.offsetWidth-c.flakeRightOffset,n=c.flakeBottom?c.flakeBottom:c.targetElement.offsetTop+c.targetElement.offsetHeight,m=parseInt(l/2,10)},this.freeze=function(){var a;if(!c.disabled)c.disabled=1;else return!1;for(a=c.timers.length;a--;)clearInterval(c.timers[a])},this.resume=function(){if(c.disabled)c.disabled=0;else return!1;c.timerInit()},this.toggleSnow=function(){c.flakes.length?(c.active=!c.active,c.active?(c.show(),c.resume()):(c.stop(),c.freeze())):c.start()},this.stop=function(){var d;this.freeze();for(d=this.flakes.length;d--;)this.flakes[d].o.style.display="none";c.events.remove(a,"scroll",c.scrollHandler),c.events.remove(a,"resize",c.resizeHandler),c.freezeOnBlur&&(f?(c.events.remove(b,"focusout",c.freeze),c.events.remove(b,"focusin",c.resume)):(c.events.remove(a,"blur",c.freeze),c.events.remove(a,"focus",c.resume)))},this.show=function(){var a;for(a=this.flakes.length;a--;)this.flakes[a].o.style.display="block"},this.SnowFlake=function(a,c,d,e){var f=this,g=a;this.type=c,this.x=d||parseInt(y(l-20),10),this.y=isNaN(e)?-y(n)-12:e,this.vX=null,this.vY=null,this.vAmpTypes=[1,1.2,1.4,1.6,1.8],this.vAmp=this.vAmpTypes[this.type],this.melting=!1,this.meltFrameCount=g.meltFrameCount,this.meltFrames=g.meltFrames,this.meltFrame=0,this.twinkleFrame=0,this.active=1,this.fontSize=10+this.type/5*10,this.o=b.createElement("div"),this.o.innerHTML=g.snowCharacter,this.o.style.color=g.snowColor,this.o.style.position=u?"fixed":"absolute",this.o.style.width=g.flakeWidth+"px",this.o.style.height=g.flakeHeight+"px",this.o.style.fontFamily="arial,verdana",this.o.style.cursor="default",this.o.style.overflow="hidden",this.o.style.fontWeight="normal",this.o.style.zIndex=g.zIndex,x.appendChild(this.o),this.refresh=function(){if(isNaN(f.x)||isNaN(f.y))return!1;f.o.style.left=f.x+"px",f.o.style.top=f.y+"px"},this.stick=function(){k||g.targetElement!==b.documentElement&&g.targetElement!==b.body?f.o.style.top=n+o-g.flakeHeight+"px":g.flakeBottom?f.o.style.top=g.flakeBottom+"px":(f.o.style.display="none",f.o.style.top="auto",f.o.style.bottom="0px",f.o.style.position="fixed",f.o.style.display="block")},this.vCheck=function(){f.vX>=0&&f.vX<.2?f.vX=.2:f.vX<0&&f.vX>-0.2&&(f.vX=-0.2),f.vY>=0&&f.vY<.2&&(f.vY=.2)},this.move=function(){var a=f.vX*r,b;f.x+=a,f.y+=f.vY*f.vAmp,f.x>=l||l-f.x<g.flakeWidth?f.x=0:a<0&&f.x-g.flakeLeftOffset<-g.flakeWidth&&(f.x=l-g.flakeWidth-1),f.refresh(),b=n+o-f.y,b<g.flakeHeight?(f.active=0,g.snowStick?f.stick():f.recycle()):(g.useMeltEffect&&f.active&&f.type<3&&!f.melting&&Math.random()>.998&&(f.melting=!0,f.melt()),g.useTwinkleEffect&&(f.twinkleFrame?(f.twinkleFrame--,f.o.style.visibility=f.twinkleFrame&&f.twinkleFrame%2===0?"hidden":"visible"):Math.random()>.9&&(f.twinkleFrame=parseInt(Math.random()*20,10))))},this.animate=function(){f.move()},this.setVelocities=function(){f.vX=p+y(g.vMaxX*.12,.1),f.vY=q+y(g.vMaxY*.12,.1)},this.setOpacity=function(a,b){if(!v)return!1;a.style.opacity=b},this.melt=function(){!g.useMeltEffect||!f.melting?f.recycle():f.meltFrame<f.meltFrameCount?(f.setOpacity(f.o,f.meltFrames[f.meltFrame]),f.o.style.fontSize=f.fontSize-f.fontSize*(f.meltFrame/f.meltFrameCount)+"px",f.o.style.lineHeight=g.flakeHeight+2+g.flakeHeight*.75*(f.meltFrame/f.meltFrameCount)+"px",f.meltFrame++):f.recycle()},this.recycle=function(){f.o.style.display="none",f.o.style.position=u?"fixed":"absolute",f.o.style.bottom="auto",f.setVelocities(),f.vCheck(),f.meltFrame=0,f.melting=!1,f.setOpacity(f.o,1),f.o.style.padding="0px",f.o.style.margin="0px",f.o.style.fontSize=f.fontSize+"px",f.o.style.lineHeight=g.flakeHeight+2+"px",f.o.style.textAlign="center",f.o.style.verticalAlign="baseline",f.x=parseInt(y(l-g.flakeWidth-20),10),f.y=parseInt(y(n)*-1,10)-g.flakeHeight,f.refresh(),f.o.style.display="block",f.active=1},this.recycle(),this.refresh()},this.snow=function(){var a=0,b=0,d=0,e=null,f;for(f=c.flakes.length;f--;)c.flakes[f].active===1?(c.flakes[f].move(),a++):c.flakes[f].active===0?b++:d++,c.flakes[f].melting&&c.flakes[f].melt();a<c.flakesMaxActive&&(e=c.flakes[parseInt(y(c.flakes.length),10)],e.active===0&&(e.melting=!0))},this.mouseMove=function(a){if(!c.followMouse)return!0;var b=parseInt(a.clientX,10);b<m?r=-s+b/m*s:(b-=m,r=b/m*s)},this.createSnow=function(a,b){var e;for(e=0;e<a;e++){c.flakes[c.flakes.length]=new c.SnowFlake(c,parseInt(y(t),10));if(b||e>c.flakesMaxActive)c.flakes[c.flakes.length-1].active=-1}d.targetElement.appendChild(x)},this.timerInit=function(){c.timers=h?[setInterval(c.snow,c.animationInterval*3),setInterval(c.snow,c.animationInterval)]:[setInterval(c.snow,c.animationInterval)]},this.init=function(){var d;for(d=0;d<c.meltFrameCount;d++)c.meltFrames.push(1-d/c.meltFrameCount);c.randomizeWind(),c.createSnow(c.flakesMax),c.events.add(a,"resize",c.resizeHandler),c.events.add(a,"scroll",c.scrollHandler),c.freezeOnBlur&&(f?(c.events.add(b,"focusout",c.freeze),c.events.add(b,"focusin",c.resume)):(c.events.add(a,"blur",c.freeze),c.events.add(a,"focus",c.resume))),c.resizeHandler(),c.scrollHandler(),c.followMouse&&c.events.add(f?b:a,"mousemove",c.mouseMove),c.animationInterval=Math.max(20,c.animationInterval),c.timerInit()},this.start=function(a){if(!w)w=!0;else if(a)return!0;if(typeof c.targetElement=="string"){var d=c.targetElement;c.targetElement=b.getElementById(d);if(!c.targetElement)throw new Error('Snowstorm: Unable to get targetElement "'+d+'"')}c.targetElement||(c.targetElement=f?b.body:b.documentElement?b.documentElement:b.body),c.targetElement!==b.documentElement&&c.targetElement!==b.body&&(c.resizeHandler=c.resizeHandlerAlt),c.resizeHandler(),c.usePositionFixed=c.usePositionFixed&&!k,u=c.usePositionFixed,l&&n&&!c.disabled&&(c.init(),c.active=!0)},c.autoStart&&c.events.add(a,"load",B,!1)}var snowStorm=new SnowStorm(window,document)