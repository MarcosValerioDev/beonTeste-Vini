"use strict";

// var slider = require("./slider");
import ShowcasePivotComponent from "./pivot";
// import { boughttogether } from "./boughttogether";

var ShowcaseInitializer = function () {
  // initialize sliders already on page
  this.initializeShowcases();

  // bind events to initialize sliders real time
  this.bindEvents();
};

export default ShowcaseInitializer;

ShowcaseInitializer.prototype.bindEvents = function () {
  document.addEventListener(
    "DOMContentLoaded",
    this.initializeShowcases.bind(this)
  );
  document.addEventListener(
    "beon.buddy.elements.handle.item.inject.success",
    this.initializeShowcaseFromInjection.bind(this)
  );
  document.addEventListener(
    "beon.buddy.inject.after",
    this.initializeShowcaseFromInjection.bind(this)
  );
};

ShowcaseInitializer.prototype.initializeShowcases = function () {
  var showcases = document.querySelectorAll(
    ".beon-showcase:not(.pivot-initialized)"
  );

  Array.prototype.slice.call(showcases).forEach(
    function (element, index) {
      this.initializeElement(element);
    }.bind(this)
  );
};

ShowcaseInitializer.prototype.initializeShowcaseFromInjection = function (
  event
) {
  var element = event.detail.element;
  var container = event.detail.container;
  var beonShowcases = container.querySelectorAll(
    ".beon-showcase:not(.pivot-initialized)"
  );

  if (beonShowcases) {
    Array.prototype.slice.call(beonShowcases).forEach(
      function (element, index) {
        if (document.readyState === "loading") {
          document.addEventListener(
            "DOMContentLoaded",
            function () {
              this.initializeElement(element);
            }.bind(this)
          );
        } else {
          this.initializeElement(element);
        }
      }.bind(this)
    );
  }
};

ShowcaseInitializer.prototype.initializeElement = function (element) {
  var classes = element.className;

  element.className = element.className + " pivot-initialized";

  // pivot showcases
  if (/--with-pivot/i.test(classes)) {
    new ShowcasePivotComponent(element);
  }
};

// (function () {
//   new ShowcaseInitializer();
// })();
