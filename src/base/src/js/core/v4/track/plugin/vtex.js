"use strict";

import log from "../../log";

export default function vtex(options) {
  this.log = log(`vtex_plugin`, true);

  var defaultOptions = {
    // if true, track cart on initialization
    immediate: false,
    // none | debounce | interval
    strategy: "none",
    intervalDelay: -1,
    debounceDelay: -1,
  };

  this.options = Object.assign(defaultOptions, options);

  this.initCartPool();

  return this;
}

vtex.prototype.initCartPool = function () {
  // if interval or debounce, listen to track done events to add event listeners
  if (["interval", "debounce"].indexOf(this.options.strategy) > -1) {
    document.addEventListener(
      "beon.tracker.dispatch.done",
      function (event) {
        if (this.cartpool) {
          this.log("cart pool already running");
          return;
        }

        var eventType = event.detail.eventType;
        var context = event.detail.type;

        if (
          eventType != "pageview" ||
          ["cart", "transaction", "checkout"].indexOf(context) > -1
        ) {
          this.log("skip cart pool at " + context + " " + eventType);
          return;
        }

        this.cartpool = new vtexCartPool(this.options);
        this.log("cartPool init with " + this.options.strategy + " strategy");
      }.bind(this)
    );
  } else {
    this.cartpool = new vtexCartPool(this.options);
  }

  // return cartpool instance
  return this.cartpool;
};

var vtexCartPool = function (options) {
  this.version = "0.2.1";

  this.api =
    "/api/checkout/pub/orderForm/?{%22expectedOrderFormSections%22:[%22clientProfileData%22,%22clientPreferencesData%22,%22items%22]}";
  this.request = null;

  var defaultOptions = {
    // if true, track cart on initialization
    immediate: false,
    // none | debounce | interval
    strategy: "none",
    intervalDelay: -1,
    debounceDelay: -1,
  };

  this.options = Object.assign(defaultOptions, options);

  switch (this.options.strategy) {
    case "debounce":
      this.debounce();
      break;
    case "interval":
      this.interval();
      break;
  }

  return this;
};

vtexCartPool.prototype.buildRequest = function () {
  var request = new XMLHttpRequest();
  request.open("GET", this.api);
  request.setRequestHeader("Content-Type", "application/json");

  this.request = request;
};

vtexCartPool.prototype.fetch = function (callback) {
  if (this.error) {
    return false;
  }

  this.buildRequest();
  this.request.addEventListener(
    "load",
    function (event) {
      var request = event.target;
      var response;

      if (request.readyState < 4 || request.status > 200) {
        throw new Error("request failed");
      }

      response = JSON.parse(request.response);

      callback(response);
    }.bind(this)
  );

  var trip = this.request.send();
  return trip;
};

vtexCartPool.prototype.parse = function (response) {
  var cart = { shipping: {}, items: [] };
  var customer = {};

  // parse items
  if (response.items && response.items.length) {
    cart.items = [];
    for (var i in response.items) {
      if (!response.items[i].hasOwnProperty("productId")) continue;

      cart.items.push({
        product_id: response.items[i].productId,
        sku: response.items[i].id,
        price_to: response.items[i].sellingPrice / 100,
        qty: response.items[i].quantity,
      });
    }
  }

  // parse shipping data
  if (response.shippingData && response.shippingData.address) {
    cart.shipping.postcode = response.shippingData.address.postalCode;
  }

  // parse totals data
  if (response.totalizers) {
    for (var i in response.totalizers) {
      if (response.totalizers[i].id == "Items")
        cart.subtotal = response.totalizers[i].value / 100;
      if (response.totalizers[i].id == "Shipping")
        cart.shipping.price = response.totalizers[i].value / 100;
    }
  }

  // parse contact data
  if (response.clientProfileData && response.clientProfileData.email) {
    customer.email = response.clientProfileData.email;
    customer.phone = response.clientProfileData.isCorporate
      ? response.clientProfileData.corporatePhone
      : response.clientProfileData.phone;
    customer.name = response.clientProfileData.isCorporate
      ? response.clientProfileData.corporateName
      : [
          response.clientProfileData.firstName,
          response.clientProfileData.lastName,
        ].join(" ");
  }

  return { cart: cart, customer: customer };
};

/**
 * parse and push fetch responses.
 * use with debounce or interval strategies
 * to handle responses and send to our api.
 */
vtexCartPool.prototype.parseAndPush = function (response) {
  var parsed = this.parse(response);
  var push = [];

  if (parsed && parsed.cart) {
    push.push([
      "track",
      "cart",
      null,
      function () {
        return parsed.cart;
      },
    ]);
  }

  if (parsed && parsed.customer) {
    push.push([
      "track",
      "customer",
      null,
      function () {
        return parsed.customer;
      },
    ]);
  }

  if (window.beon) {
    for (var i = push.length - 1; i >= 0; i--) {
      window.beon.apply(window.beon, push[i]);
    }
  }
};

/**
 * fetch and parse vtex api response.
 * default callback is parseAndPush method.
 * in standalone mode you should pass a callback.
 *
 * returns the trip itself if you would like to handle
 * the response yourself.
 */
vtexCartPool.prototype.handleFetch = function (userCallback) {
  if (this.error) {
    return false;
  }

  var callback = userCallback || this.parseAndPush;

  try {
    var trip = this.fetch(callback);
    return trip;
  } catch (e) {
    this.error = true;
  }
};

vtexCartPool.prototype.interval = function (immediate, timeout) {
  if (this.options.immediate) {
    this.handleFetch.bind(this);
  }

  this.intervalTimeout = window.setTimeout(
    function () {
      var handleState = this.handleFetch.bind(this);
      if (handleState) this.interval(immediate, timeout);
    }.bind(this),
    timeout || this.options.intervalDelay
  );
};

vtexCartPool.prototype.debounce = function (immediate, delay) {
  if (this.options.immediate) {
    this.handleFetch.bind(this);
  }

  document.addEventListener(
    "click",
    function () {
      if (this.debounceTimeout) {
        window.clearTimeout(this.debounceTimeout);
      }

      this.debounceTimeout = window.setTimeout(
        this.handleFetch.bind(this),
        delay || this.options.debounceDelay
      );
    }.bind(this)
  );
};
