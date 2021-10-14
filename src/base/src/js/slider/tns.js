"use strict";

import { tns } from "../../../node_modules/tiny-slider/src/tiny-slider";

export var slider = function (element, options) {
  this.root = element;

  // add options to allow slider fine control
  this.options = this.extendObject(
    {
      gutter: 10,
      edgePadding: 10,
      containerClass: ".beon-slider__slides",
      autoplay: false,
      autoplayTimeout: 3000,
      responsive: {
        1: {
          items: 2,
        },
        767: {
          items: 4,
        },
      },
    },
    options || {}
  );

  this.setup = {
    container: element.querySelector(this.options.containerClass),
    mode: "carousel",
    axis: "horizontal",
    gutter: this.options.gutter,
    edgePadding: this.options.edgePadding,
    items: 3,
    slideBy: "page",
    mouseDrag: true,
    swipeAngle: false,
    speed: 400,
    controls: true,
    controlsPosition: "bottom",
    nav: true,
    navPosition: "bottom",
    rewind: false,
    loop: false,
    preventActionWhenRunning: false,
    preventScrollOnTouch: false,
    responsive: this.options.responsive,
    autoplay: this.options.autoplay,
    autoplayTimeout: this.options.autoplayTimeout,
    autoplayHoverPause: true,
    autoplayResetOnVisibility: true,
    lazyload: true,
    lazyloadSelector: ".bn-lazy",
  };

  this.init();

  return this;
};

slider.prototype.init = function () {
  if (!/slider-initialized/i.test(this.root.className)) {
    this.getConfigFromElement();
    this.applySlider();
  } else {
    console.log(
      `already initialized slider at ${this.root.getAttribute("id")}`
    );
  }
};

slider.prototype.getConfigFromElement = function () {
  var data, elementConfig;

  data = this.root.getAttribute("data-config");

  // {viewports: {"0": {i:1,s:1}, "600":{i:2,s:2}}]}

  if (!data) {
    data = "{}";
  }

  try {
    elementConfig = JSON.parse(data);

    if (elementConfig.viewports) {
      var viewports = {};

      for (var i in elementConfig.viewports) {
        viewports[i] = {
          items: elementConfig.viewports[i].i || 1,
          scrollBy: elementConfig.viewports[i].s || 1,
        };

        if (elementConfig.viewports[i].b !== "undefined") {
          viewports[i].gutter = elementConfig.viewports[i].b;
          viewports[i].edgePadding = elementConfig.viewports[i].b;
        }
      }

      this.setup.responsive = viewports;
    }

    if (elementConfig.hasOwnProperty("dots")) {
      this.setup.nav = elementConfig.dots;
    }

    if (elementConfig.hasOwnProperty("autoplay")) {
      this.setup.autoplay = true;
      this.setup.autoplayTimeout = elementConfig.autoplay * 1000;
      this.setup.loop = true;
    }

    if (elementConfig.hasOwnProperty("rewind")) {
      this.setup.rewind = true;
      this.setup.loop = false;
    }

    if (elementConfig.hasOwnProperty("loop")) {
      this.setup.rewind = false;
      this.setup.loop = true;
    }

    if (elementConfig.hasOwnProperty("center")) {
      this.setup.center = true;
    }

    if (elementConfig.hasOwnProperty("axis")) {
      this.setup.axis = elementConfig.axis;
    }

    if (elementConfig.hasOwnProperty("preventScrollOnTouch")) {
      this.setup.preventScrollOnTouch = elementConfig.preventScrollOnTouch;
    }

    // check if there is bn-lazy image
    // prevent non-lazy enabled sliders to break images
    var bnLazy = this.root.querySelector("img.bn-lazy");
    if (!bnLazy) {
      this.setup.lazyload = false;
    }

    // console.log(this.setup);
  } catch (e) {
    console.log(e);
  }

  return this.setup;
};

slider.prototype.applySlider = function () {
  this.root.className = this.root.className + " slider-initialized";
  this.slider = tns(this.setup);

  this.bindBreakpointEvents();

  return this;
};

slider.prototype.bindBreakpointEvents = function () {
  // update column count on every breakpoint change
  this.slider.events.on("newBreakpointEnd", this.updateColumnsCount.bind(this));

  // update on initialization
  this.updateColumnsCount();
};

slider.prototype.updateColumnsCount = function () {
  var info = this.slider.getInfo();
  var currentItemsCount = info.items;

  this.root.className = this.root.className.replace(/bn-columns--[0-9]+/i, "");
  this.root.className += " bn-columns--" + currentItemsCount;

  return this;
};

// utils
slider.prototype.extendObject = function (o1, o2) {
  if (window.Object) {
    return Object.assign(o1, o2);
  }

  for (var key in o1) {
    if (o2.hasOwnProperty(key)) o1[key] = o2[key];
  }

  return o1;
};
