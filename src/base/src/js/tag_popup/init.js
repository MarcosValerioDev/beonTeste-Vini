"use strict";

// var slider = require("./slider");
import TagPopupComponent from "./popup";

var TagPopupInitializer = function() {
  // initialize sliders already on page
  this.initPopups();

  // bind events to initialize sliders real time
  this.bindEvents();
};

export default TagPopupInitializer;

TagPopupInitializer.prototype.bindEvents = function() {
  document.addEventListener("DOMContentLoaded", this.initPopups.bind(this));
  document.addEventListener(
    "beon.buddy.elements.handle.item.inject.success",
    this.initPopupFromInjection.bind(this)
  );
  document.addEventListener(
    "beon.buddy.inject.after",
    this.initPopupFromInjection.bind(this)
  );
};

TagPopupInitializer.prototype.initPopups = function() {
  var popups = document.querySelectorAll(".beon-tagpopup:not(.initialized)");

  Array.prototype.slice.call(popups).forEach(
    function(root, index) {
      this.initPopup(root);
    }.bind(this)
  );
};

TagPopupInitializer.prototype.initPopupFromInjection = function(event) {
  var container = event.detail.container;
  var root = container.querySelector(".beon-tagpopup:not(.initialized)");

  if (root) {
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        function() {
          this.initPopup(root);
        }.bind(this)
      );
    } else {
      this.initPopup(root);
    }
  }
};

TagPopupInitializer.prototype.initPopup = function(root) {
  try {
    var rawConfig = root.getAttribute("data-config");
    var config = JSON.parse(rawConfig);

    new TagPopupComponent(root, config);
  } catch (e) {
    console.log("failed to build tagpopup", e);
  }
};

(function() {
  if (window) window.BeonTagPopupInitializer = TagPopupInitializer;
})();
