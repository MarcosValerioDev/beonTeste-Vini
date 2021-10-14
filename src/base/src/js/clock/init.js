"use strict";

// var slider = require("./slider");
import ClockComponent from "./clock";

var ClockInitializer = function () {
  this.componentRootSelector = ".beon-clock";

  // initialize sliders already on page
  this.initComponents();

  // bind events to initialize sliders real time
  this.bindEvents();
};

export default ClockInitializer;

ClockInitializer.prototype.bindEvents = function () {
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

ClockInitializer.prototype.initComponents = function () {
  var components = document.querySelectorAll(
    this.componentRootSelector + ":not(.initialized)"
  );

  Array.prototype.slice.call(components).forEach(
    function (root) {
      this.initComponent(root);
    }.bind(this)
  );
};

ClockInitializer.prototype.initComponentFromInjection = function (event) {
  var container = event.detail.container;
  var root = container.querySelector(
    this.componentRootSelector + ":not(.initialized)"
  );

  if (root) {
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        function () {
          this.initComponent(root);
        }.bind(this)
      );
    } else {
      this.initComponent(root);
    }
  }
};

ClockInitializer.prototype.initComponent = function (root) {
  try {
    window.beon_init_log = window.beon_init_log || [];

    var rawConfig = root.getAttribute("data-config");
    var rootId = root.id;
    var config = JSON.parse(rawConfig);

    // if (window.beon_init_log.indexOf(rootId) > -1) {
    //   console.log("clock already initialized " + rootId);
    //   return;
    // }

    // window.beon_init_log.push(rootId);

    new ClockComponent(root, config);
  } catch (e) {
    console.log("failed to build component " + this.componentRootSelector, e);
  }
};

(function () {
  if (window) window.BeonClockInitializer = ClockInitializer;
})();
