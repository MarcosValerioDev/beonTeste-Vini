"use strict";

// var slider = require("./slider");
import EasterEggComponent from "./easteregg";

var EasterEggInitializer = function() {
  this.componentRootSelector = ".beon-easteregg";

  // initialize sliders already on page
  this.initComponents();

  // bind events to initialize sliders real time
  this.bindEvents();
};

export default EasterEggInitializer;

EasterEggInitializer.prototype.bindEvents = function() {
  document.addEventListener("DOMContentLoaded", this.initComponents.bind(this));
  document.addEventListener(
    "beon.buddy.elements.handle.item.inject.success",
    this.initComponentFromInjection.bind(this)
  );
  document.addEventListener(
    "beon.buddy.inject.after",
    this.initComponentFromInjection.bind(this)
  );
};

EasterEggInitializer.prototype.initComponents = function() {
  var components = document.querySelectorAll(
    this.componentRootSelector + ":not(.initialized)"
  );

  Array.prototype.slice.call(components).forEach(
    function(root) {
      this.initComponent(root);
    }.bind(this)
  );
};

EasterEggInitializer.prototype.initComponentFromInjection = function(event) {
  var container = event.detail.container;
  var root = container.querySelector(
    this.componentRootSelector + ":not(.initialized)"
  );

  if (root) {
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        function() {
          this.initComponent(root);
        }.bind(this)
      );
    } else {
      this.initComponent(root);
    }
  }
};

EasterEggInitializer.prototype.initComponent = function(root) {
  try {
    var rawConfig = root.getAttribute("data-config");
    var config = JSON.parse(rawConfig);

    new EasterEggComponent(root, config);
  } catch (e) {
    console.log("failed to build component " + this.componentRootSelector, e);
  }
};

(function() {
  if (window) window.BeonEasterEggInitializer = EasterEggInitializer;
})();
