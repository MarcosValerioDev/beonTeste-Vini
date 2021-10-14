"use strict";

import log from "./log";
import vtex from "./track/parser/vtex";

export default function dataLayer(engine) {
  this.engine = engine;
  this.log = log("tracker", this.engine.debug);

  this.defaultParser = undefined;

  this.payloadHandlers = {
    home: null,
    catalog: null,
    product: null,
    cart: null,
    transaction: null,
    customer: null
  };

  this.init();

  return this;
}

// init methods
dataLayer.prototype.init = function() {
  document.addEventListener(
    "beon.engine.create.after",
    function() {
      this.registerParser(this.engine.platform);
    }.bind(this)
  );

  return this;
};

dataLayer.prototype.getDataLayer = function(value, key) {
  var data = undefined;
  var key = key || "event";
  if (window.dataLayer)
    for (var i = 0; i < window.dataLayer.length; i++)
      if (
        window.dataLayer[i][key] &&
        value.indexOf(window.dataLayer[i][key]) > -1
      ) {
        data = window.dataLayer[i];
        break;
      }

  return data;
};

/**
 * Default payloads handling
 */

dataLayer.prototype.registerParser = function(parser) {
  switch (parser) {
    case "vtex":
      this.log("registering parser " + parser);
      this.defaultParser = new vtex(this);
      break;
  }

  return this.defaultParser;
};

dataLayer.prototype.defaultPayload = function(type) {
  if (!this.defaultParser) return {};

  return this.defaultParser.parse(type) || {};
};

dataLayer.prototype.parse = function(type, custom) {
  var payload = this.defaultPayload(type);
  var customPayload;

  if (custom) {
    try {
      customPayload = custom.call(this, payload);
      payload = Object.assign(payload, customPayload);
    } catch (e) {
      this.log(e);
    }
  }

  return payload;
};
