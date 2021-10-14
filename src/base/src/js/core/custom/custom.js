"use strict";

// import tracker
import tracker from "../v4/tracker";
import Parser from "../v4/parser";

var BeonCustom = function () {
  return this;
};

export default BeonCustom;

BeonCustom.prototype.init = function () {
  this.initParser();
  this.initTracker();
  this.initCustomTriggers();
};

BeonCustom.prototype.initParser = function (parser) {
  this.parser = parser || new Parser();
  return this.parser;
};

// init and extend tracker following client definitions
BeonCustom.prototype.initTracker = function () {
  // init tracker
  this.tracker = new tracker(window.beone, this.parser);
  this.tracker.init();
};

/**
 * Define custom triggers that calls beon track method.
 * Usefull to track pages off of GTM.
 */
BeonCustom.prototype.initCustomTriggers = function () {};
