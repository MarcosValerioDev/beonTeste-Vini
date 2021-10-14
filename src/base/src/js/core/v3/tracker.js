"use strict";

import log from "./log";
import vtexPlugins from "./track/plugin/vtex";

export default function tracker(engine) {
  this.engine = engine;
  this.log = log("tracker", this.engine.debug);

  this.defaultMethods = {
    track: this.track.bind(this)
  };

  this.plugins = {};

  this.init();

  return this;
}

// init methods
tracker.prototype.init = function() {
  this.engine.registerMethods(this.defaultMethods);

  document.addEventListener(
    "beon.engine.create.after",
    function() {
      this.initPlugins();
    }.bind(this)
  );

  return this;
};

tracker.prototype.initPlugins = function() {
  var platform = this.engine.platform;
  switch (platform) {
    case "vtex":
      this.plugins.vtex = new vtexPlugins(this);
      break;
  }
};

tracker.prototype.track = function() {
  var args = Array.prototype.slice.call(arguments);
  var event = args.shift();
  var type = args.shift();
  var custom = args.shift();

  switch (event) {
    case "pageview":
      this.pageview(type, custom);
      break;

    case "cart_update":
      this.cartUpdate(type, custom);
      break;

    case "customer_update":
      this.customerUpdate(type, custom);
      break;

    case "transaction":
      this.transaction(type, custom);
      break;
    default:
      this.log("invalid method to track");
      return;
  }

  // dispatch track event
  // this allow plugins to interact
  this.engine.dispatchEvent("tracker.dispatch", {
    event,
    type
  });
};

/**
 * Events handling
 */

tracker.prototype.pageview = function(type, custom) {
  var payload = this.engine.dataLayer.parse(type, custom);
  payload.type = type;

  var pageview = {
    timestamp: Date.now(),
    type: "pageview",
    title: document.title,
    url: window.location.href,
    referrer: document.referrer,
    origin: window.location.hostname,
    payload: payload
  };

  beon("send", "event", "pageview", pageview);
  this.log(pageview);

  return;
};

tracker.prototype.cartUpdate = function(type, custom) {
  var payload = this.engine.dataLayer.parse("cart", custom);

  var event = {
    type: "cart",
    timestamp: Date.now(),
    pageview_id: null,
    payload: payload
  };

  beon("send", "event", "cart_update", event);
  this.log(event);

  return;
};

tracker.prototype.customerUpdate = function(type, custom) {
  var payload = this.engine.dataLayer.parse("customer", custom);

  var event = {
    type: "customer",
    timestamp: Date.now(),
    pageview_id: null,
    payload: payload
  };

  beon("send", "event", "customer_update", event);
  this.log(event);

  return;
};

tracker.prototype.transaction = function(type, custom) {
  var payload = this.engine.dataLayer.parse("transaction", custom);

  var event = {
    type: "transaction",
    timestamp: Date.now(),
    pageview_id: null,
    payload: payload
  };

  beon("send", "event", "transaction_update", event);
  this.log(event);

  return;
};
