// PNGHandler: Object-Oriented Javascript-based PNG wrapper
// --------------------------------------------------------
// Version 1.1.20031206
// Code by Scott Schiller - www.schillmania.com
// --------------------------------------------------------
// Description:
// Provides gracefully-degrading PNG functionality where
// PNG is supported natively or via filters (Damn you, IE!)
// Should work with PNGs as images and DIV background images.

function PNGHandler() {
  var self = this;

  this.na = navigator.appName.toLowerCase();
  this.nv = navigator.appVersion.toLowerCase();
  this.isIE = this.na.indexOf('internet explorer')+1?1:0;
  this.isWin = this.nv.indexOf('windows')+1?1:0;
  this.ver = this.isIE?parseFloat(this.nv.split('msie ')[1]):parseFloat(this.nv);
  this.isMac = this.nv.indexOf('mac')+1?1:0;
  this.transform = null;

  this.filterMethod = function(oOld) {
    // IE 5.5+ proprietary filter garbage (boo!)
    // Create new element based on old one. Doesn't seem to render properly otherwise (due to filter?)
    // use proprietary "currentStyle" object, so rules inherited via CSS are picked up.

    var o = document.createElement('div'); // oOld.nodeName
    var filterID = 'DXImageTransform.Microsoft.AlphaImageLoader';
    o.style.width = oOld.currentStyle.width;
    o.style.height = oOld.currentStyle.height;

    if (oOld.nodeName == 'DIV') {
      var b = oOld.currentStyle.backgroundImage.toString(); // parse out background image URL
      oOld.style.backgroundImage = 'none';
      // Parse out background image URL from currentStyle object.
      var i1 = b.indexOf('url("')+5;
      var newSrc = b.substr(i1,b.length-i1-2).replace('.gif','.png'); // find first instance of ") after (", chop from string
      o = oOld;
      o.style.writingMode = 'lr-tb'; // Has to be applied so filter "has layout" and is displayed. Seriously. Refer to http://msdn.microsoft.com/workshop/author/filter/reference/filters/alphaimageloader.asp?frame=true
      o.style.filter = "progid:"+filterID+"(src='"+newSrc+"',sizingMethod='scale')";
      // Replace the old (existing) with the new (just created) element.
      // oOld.parentNode.replaceChild(o,oOld);
    } else if (oOld.nodeName == 'IMG') {
      var newSrc = oOld.getAttribute('src').replace('.gif','.png');
      // apply filter
      oOld.src = 'image/snow/none.gif'; // get rid of image
      oOld.style.filter = "progid:"+filterID+"(src='"+newSrc+"',sizingMethod='scale')";
      oOld.style.writingMode = 'lr-tb'; // Has to be applied so filter "has layout" and is displayed. Seriously. Refer to http://msdn.microsoft.com/workshop/author/filter/reference/filters/alphaimageloader.asp?frame=true
    }
  }

  this.pngMethod = function(o) {
    // Native transparency support. Easy to implement. (woo!)

    var b, i1, newSrc; // background-related variables
    if (o.nodeName == 'DIV' && !(this.isIE && this.isMac)) { // ie:mac PNG support broken for DIVs with PNG backgrounds
      if (document.defaultView) {
        if (document.defaultView.getComputedStyle) {
          b = document.defaultView.getComputedStyle(o,'').getPropertyValue('background-image');
          i1 = b.indexOf('url(')+4;
          newSrc = b.substr(i1,b.length-i1-1);
        }
      }
      // set background image, replacing .gif
      o.style.backgroundImage = 'url('+newSrc.replace('.gif','.png')+')';
    } else if (o.nodeName == 'IMG') {
      o.src = o.src.replace('.gif','.png');
    } else if (!this.isMac) {
      // window.status = 'PNGImage.applyPNG(): node is not a DIV or IMG.';
    }
  }
  
  this.supportTest = function() {
    // Determine method to use.
    // IE 5.5+/win32: filter

    if (this.isIE && this.isWin && this.ver >= 5.5) {
      // Support for PNG - milelage may vary
      // window.status = 'IE 5.5+ filter method.';
      self.transform = self.filterMethod;
    } else if (!this.isIE && this.ver < 5) {
      self.transform = null;
      // No PNG support or broken support
      // Leave existing content as-is.
      // window.status = 'No support or broken support. Using GIF.';
    } else if (!this.isIE && this.ver >= 5 || (this.isIE && this.isMac && this.ver >= 5)) { // version 5+ browser (not IE), or IE:mac 5+
      // window.status = 'Using native PNG method.';
      self.transform = self.pngMethod;
    } else {
      // window.status = 'Broser test failed - Assumed no support or broken support. Using GIF.';
      self.transform = null;
      return false;
    }
    return true;
  }

  this.init = function() {
    if (this.supportTest()) {
      this.elements = getElementsByClassName('png');
      for (var i=0; i<this.elements.length; i++) {
        this.transform(this.elements[i]);
      }
    }
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