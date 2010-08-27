// Generic addEventHandler() wrapper
// ---------------------------------
// Version 1.1.20031218
// A generic interface for adding DOM event handlers
//
// Code by Scott Schiller | schillmania.com


var addEventHandler = null;
var removeEventHandler = null;
  
function addEventHandlerDOM(o,eventType,eventHandler,eventBubble) {
  o.addEventListener(eventType,eventHandler,eventBubble);
}

function removeEventHandlerDOM(o,eventType,eventHandler,eventBubble) {
  o.removeEventListener(eventType,eventHandler,eventBubble);
}
  
function addEventHandlerIE(o,eventType,eventHandler) { // IE workaround
  if (!eventType.indexOf('on')+1) eventType = 'on'+eventType;
  o.attachEvent(eventType,eventHandler); // Note addition of "on" to event type
}
  
function removeEventHandlerIE(o,eventType,eventHandler) {
  if (!eventType.indexOf('on')+1) eventType = 'on'+eventType;
  o.detachEvent(eventType,eventHandler);
}

function addEventHandlerOpera(o,eventType,eventHandler,eventBubble) {
  (o==window?document:o).addEventListener(eventType,eventHandler,eventBubble);
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