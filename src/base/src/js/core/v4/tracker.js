"use strict";

import uuid from "uuid";
import log from "./log";

export default function tracker(engine, parser) {
  this.engine = engine;
  this.log = log("tracker", this.engine.debug);

  this.parser = parser;

  return this;
}

// init methods
tracker.prototype.init = function() {
  this.consumeTrackQueue();

  return this;
};

tracker.prototype.consumeTrackQueue = function() {
  var queue = this.engine.getTrackQueue();
  queue.consume(this.track.bind(this));
};

tracker.prototype.track = function(event) {
  var eventType = event.shift();
  var type = event.shift();
  var customPayload = event.shift();

  switch (eventType) {
    case "pageview":
      this.pageview(type, customPayload);
      break;

    case "cart_update":
    case "cart":
      this.cartUpdate(customPayload);
      break;

    case "customer_update":
    case "customer":
      this.customerUpdate(customPayload);
      break;

    case "transaction":
      this.transaction(customPayload);
      break;

    default:
      this.log("invalid method to track");
      return;
  }

  // dispatch track event
  // this allow plugins to interact
  this.engine.dispatchEvent("tracker.dispatch.done", {
    eventType,
    type
  });
};

/**
 * Events handling
 */

tracker.prototype.pageview = function(type, customPayload) {
  var payload = customPayload ? customPayload() : this.parser.parse(type);

  var pageview = {
    event_id: uuid.v4(),
    timestamp: Date.now(),
    type: "pageview",
    payload: Object.assign(
      {
        pageType: type,
        title: document.title,
        url: window.location.href,
        referer: document.referrer
      },
      payload
    )
  };

  beon("send", "event", pageview);
  this.log(pageview);

  return;
};

tracker.prototype.cartUpdate = function(customPayload) {
  var payload = customPayload ? customPayload() : this.parser.parse("cart");

  var event = {
    event_id: uuid.v4(),
    timestamp: Date.now(),
    type: "cart",
    payload: payload
  };

  beon("send", "event", event);
  this.log(event);

  return;
};

tracker.prototype.customerUpdate = function(customPayload) {
  var payload = customPayload ? customPayload() : this.parser.parse("customer");

  var event = {
    event_id: uuid.v4(),
    timestamp: Date.now(),
    type: "customer",
    payload: payload
  };

  beon("send", "event", event);
  this.log(event);

  return;
};

tracker.prototype.transaction = function(customPayload) {
  var payload = customPayload
    ? customPayload()
    : this.parser.parse("transaction");

  var event = {
    event_id: uuid.v4(),
    timestamp: Date.now(),
    type: "transaction",
    payload: payload
  };

  beon("send", "event", event);
  this.log(event);

  return;
};
