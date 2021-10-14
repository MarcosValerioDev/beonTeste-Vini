"use strict";

// var slider = require("./slider");
import { slider } from "./tns";

var SliderInitializer = function () {
  // console.log(`SliderInitializer initialized at ${Date.now()}`);

  // initialize sliders already on page
  this.initializeSliders();

  // bind events to initialize sliders real time
  this.bindEvents();
};

export default SliderInitializer;

SliderInitializer.prototype.bindEvents = function () {
  document.addEventListener(
    "DOMContentLoaded",
    this.initializeSliders.bind(this)
  );
  document.addEventListener(
    "beon.buddy.elements.handle.item.inject.success",
    this.initializeSliderFromInjection.bind(this)
  );
  document.addEventListener(
    "beon.buddy.inject.after",
    this.initializeSliderFromInjection.bind(this)
  );
};

SliderInitializer.prototype.initializeSliders = function () {
  var sliders = document.querySelectorAll(
    ".beon-slider:not(.slider-initialized)"
  );

  Array.prototype.slice.call(sliders).forEach(
    function (element, index) {
      this.initializeSlider(element, "DOMContentLoaded");
    }.bind(this)
  );
};

SliderInitializer.prototype.initializeSliderFromInjection = function (event) {
  var element = event.detail.element;
  var container = event.detail.container;

  var beonSliders = container.querySelectorAll(
    ".beon-slider:not(.slider-initialized)"
  );

  if (beonSliders) {
    Array.prototype.slice.call(beonSliders).forEach(
      function (element, index) {
        if (document.readyState === "loading") {
          document.addEventListener(
            "DOMContentLoaded",
            function () {
              this.initializeSlider(element, "DOMContentLoaded");
            }.bind(this)
          );
        } else {
          this.initializeSlider(element, "from_injection");
        }
      }.bind(this)
    );
  }
};

SliderInitializer.prototype.initializeSlider = function (element, method) {
  return new Promise((resolve) => {
    new slider(element);

    window.beone.dispatchEvent("buddy.slider.init.after", {
      element: element,
      method: method,
    });

    resolve();
  });
};

(function () {
  new SliderInitializer();
})();
