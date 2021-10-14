"use strict";

import log from "./log";

export default function Parser() {
  this.log = log("Parser", true);
  return this;
}

Parser.prototype.getDataLayer = function (regex, key, topBottom) {
  var found = [];
  var key = key || "event";

  if (window.dataLayer)
    for (var i = 0; i < window.dataLayer.length; i++) {
      if (window.dataLayer[i][key] && regex.test(window.dataLayer[i][key])) {
        found.push(window.dataLayer[i]);
      }
    }

  return topBottom === "bottom" ? found.pop() : found.shift();
};

Parser.prototype.parse = function (type) {
  var parse = undefined;

  switch (type) {
    case "homepage":
      parse = this.parseHomepage();
      break;

    case "product":
      parse = this.parseProduct();
      break;

    case "catalog":
      parse = this.parseCatalog();
      break;

    case "cart":
      parse = this.parseCart();
      break;

    case "customer":
      parse = this.parseCustomer();
      break;

    case "transaction":
      parse = this.parseTransaction();
      break;

    case "search":
      parse = this.parseSearch();
      break;

    case "notfound":
      parse = this.parseNotfound();
      break;
  }

  return parse || {};
};

Parser.prototype.parseHomepage = function () {
  return {};
};

Parser.prototype.parseProduct = function () {
  return {
    sku: undefined,
    product_id: undefined,
  };
};

Parser.prototype.parseCatalog = function () {
  return {
    trees: undefined,
  };
};

Parser.prototype.parseCart = function () {
  return {
    items: undefined,
    subtotal: undefined,
    coupon: undefined,
    shipping: {
      postcode: undefined,
      price: undefined,
      method: undefined,
    },
  };
};

Parser.prototype.parseTransaction = function () {
  return {
    items: undefined,
    subtotal: undefined,
    coupon: undefined,
    shipping: {
      postcode: undefined,
      price: undefined,
      method: undefined,
    },
    customer: {
      email: undefined,
      name: undefined,
    },
    payments: undefined,
  };
};

Parser.prototype.parseCustomer = function () {
  return {
    email: undefined,
    name: undefined,
    postcode: undefined,
  };
};

Parser.prototype.parseSearch = function () {
  return {};
};

Parser.prototype.parseNotfound = function () {
  return {};
};
