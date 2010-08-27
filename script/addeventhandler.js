// Generic addEventHandler() wrapper
// ---------------------------------
// Version 1.0.20031206
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
  
if (document.addEventListener) {
  // DOM event handler method
  addEventHandler = addEventHandlerDOM;
  removeEventHandler = removeEventHandlerDOM;
} else if (document.attachEvent) {
  // IE event handler method
  addEventHandler = addEventHandlerIE;
  removeEventHandler = removeEventHandlerIE;
} else {
  // not supported
  addEventHandler = function() {}
}