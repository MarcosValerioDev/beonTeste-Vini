"use strict";

import Parser from "../../parser";

var VtexParser = Parser;
export default VtexParser;

var treeIdCompose = (str) =>
  str
    .toLowerCase()
    .replace(/\s/gi, "_")
    .replace(/([\xE0-\xFF])/gi, (input) => {
      const charlist = [
        [/[\xE0-\xE6]/g, "a"],
        [/[\xE8-\xEB]/g, "e"],
        [/[\xEC-\xEF]/g, "i"],
        [/[\xF2-\xF6]/g, "o"],
        [/[\xF9-\xFC]/g, "u"],
        [/\xE7/g, "c"],
        [/\xF1/g, "n"],
      ];
      const found = charlist.find((m) => m[0].test(input));
      return found ? found[1] : input;
    })
    .replace(/\W/gi, "");

VtexParser.prototype.parseProduct = function () {
  var source = this.getDataLayer(/product/i, "pageCategory");

  if (!source) {
    this.log("empty source at parseProduct parser");
    return {};
  }

  // @todo select current product sku to track pageview
  return {
    sku: Object.keys(source.skuStocks).shift(),
    product_id: source.productId,
  };
};

VtexParser.prototype.parseCatalog = function () {
  var source = this.getDataLayer(/(category|department)/i, "pageCategory");

  if (!source) {
    this.log("empty source at parseCatalog parser");
    return {};
  }

  var trees = [];

  if (source.pageCategory == "Category") {
    trees.push({
      kind: "category",
      tree_id: treeIdCompose(source.categoryName || source.pageTitle),
    });
  }

  if (source.pageDepartment) {
    trees.push({
      kind: "department",
      tree_id: treeIdCompose(source.pageDepartment),
    });
  }

  return {
    trees: trees,
  };
};

VtexParser.prototype.parseCart = function () {
  return this.parseOrderForm();
};

VtexParser.prototype.parseTransaction = function () {
  return this.parseTransactionInfo();
};

VtexParser.prototype.parseCustomer = function () {
  var orderForm = this.parseOrderForm();
  var customer = {};

  if (!orderForm) {
    this.log("invalid orderForm at parseCustomer parser");
    return {};
  }

  if (orderForm.customer && orderForm.customer.email)
    customer.email = orderForm.customer.email;

  if (orderForm.customer && orderForm.customer.name)
    customer.name = orderForm.customer.name;

  if (orderForm.shipping && orderForm.shipping.postcode)
    customer.postcode = orderForm.shipping.postcode;

  return customer;
};

VtexParser.prototype.parseSearch = function () {
  var search = { term: undefined, results: undefined };
  var source = this.getDataLayer(/InternalSiteSearch/i, "pageCategory");

  if (source) {
    search.term = source.siteSearchTerm;
    search.results_count = source.siteSearchResults;
  }

  return search;
};

VtexParser.prototype.parseOrderForm = function () {
  var source = this.getDataLayer(
    /^(cartLoaded|cart|email|shipping|payment|orderPlaced)$/i,
    "event"
  );

  if (!source) {
    this.log("empty source at parseOrderForm parser");
    return undefined;
  }

  var form = {
    items: [],
    subtotal: null,
    coupons: [],
    shipping: {
      postcode: null,
      price: null,
      method: null,
    },
    customer: {
      email: null,
      name: null,
    },
    payments: [],
  };

  if (source.orderFormProducts)
    for (var i in source.orderFormProducts) {
      var item = source.orderFormProducts[i];
      form.items.push({
        product_id: item.id,
        sku: item.sku,
        qty: item.quantity,
        price_to: item.price,
      });
    }

  if (source.orderFormPromoCode) form.coupons.push(source.orderFormPromoCode);

  if (source.orderFormTotal) form.subtotal = source.orderFormTotal / 100;

  if (source.orderFormShipping) {
    form.shipping.postcode = source.visitorDemographicInfo[0];
    form.shipping.price = source.orderFormShipping;
    form.shipping.method = source.orderFormShippingMethod;
  }

  if (source.visitorContactInfo) {
    form.customer.email = source.visitorContactInfo.shift();
    form.customer.name = source.visitorContactInfo.join(" ");
  }

  if (source.orderFormPaymentType) {
    form.payments.push(source.orderFormPaymentType);
  }

  return form;
};

VtexParser.prototype.parseTransactionInfo = function () {
  var source = this.getDataLayer(/orderPlaced/i);

  if (!source) {
    this.log("empty source at parseTransactionInfo parser");
    return undefined;
  }

  var transaction = {
    id: null,
    items: [],
    total: null,
    shipping: {
      price: null,
      method: null,
      postcode: null,
    },
    payments: [],
  };

  transaction.id = source.transactionId;
  transaction.total = source.transactionTotal;

  for (var i in source.transactionProducts) {
    var item = source.transactionProducts[i];
    transaction.items.push({
      product_id: item.id,
      sku: item.sku,
      qty: item.quantity,
      price_to: item.price,
    });
  }

  transaction.shipping.price = source.transactionShipping;

  for (var i = source.transactionPaymentType.length - 1; i >= 0; i--) {
    var payment = source.transactionPaymentType[i];
    transaction.payments.push(payment.group);
  }

  return transaction;
};
