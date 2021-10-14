"use strict";

export default function vtex(tracker) {
    this.tracker = tracker;
    return this;
}

vtex.prototype.parse = function(type) {
    var parse = undefined;

    switch (type) {
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
    }

    return parse;
};

vtex.prototype.parseProduct = function() {
    var source = this.tracker.engine.dataLayer.getDataLayer(
        "Product",
        "pageCategory"
    );

    if (!source) {
        this.tracker.log("empty source at parseProduct parser");
        return {};
    }

    return {
        sku: Object.keys(source.skuStocks),
        product_id: source.productId
    };
};

vtex.prototype.parseCatalog = function() {
    var source = this.tracker.engine.dataLayer.getDataLayer(
        ["Category", "Department"],
        "pageCategory"
    );

    if (!source) {
        this.tracker.log("empty source at parseCatalog parser");
        return {};
    }

    var trees = [];

    if (source.pageCategory == "Category") {
        trees.push({
            kind: "category",
            tree_id: source.categoryName
        });
    }

    trees.push({
        kind: "department",
        tree_id: source.pageDepartment
    });

    return {
        trees: trees
    };
};

vtex.prototype.parseCart = function() {
    return this.parseOrderForm();
};

vtex.prototype.parseTransaction = function() {
    return this.parseTransactionInfo();
};

vtex.prototype.parseCustomer = function() {
    var orderForm = this.parseOrderForm();
    var customer = {};

    if (!orderForm) {
        this.tracker.log("invalid orderForm at parseCustomer parser");
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

vtex.prototype.parseOrderForm = function() {
    var source = this.tracker.getDataLayer([
        "cartLoaded",
        "email",
        "shipping",
        "payment",
        "orderPlaced"
    ]);

    if (!source) {
        this.tracker.log("empty source at parseOrderForm parser");
        return undefined;
    }

    var form = {
        items: [],
        subtotal: null,
        coupon: null,
        shipping: {
            postcode: null,
            price: null,
            method: null
        },
        customer: {
            email: null,
            name: null
        },
        payments: []
    };

    if (source.orderFormProducts)
        for (var i in source.orderFormProducts) {
            var item = source.orderFormProducts[i];
            form.items.push({
                product_id: item.id,
                sku: item.sku,
                qty: item.quantity,
                price_to: item.price
            });
        }

    if (source.orderFormPromoCode) form.coupon = source.orderFormPromoCode;

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

vtex.prototype.parseTransactionInfo = function() {
    var source = this.tracker.getDataLayer(["orderPlaced"]);

    if (!source) {
        this.tracker.log("empty source at parseTransactionInfo parser");
        return undefined;
    }

    var transaction = {
        id: null,
        items: [],
        total: null,
        shipping: {
            price: null
        },
        payments: []
    };

    transaction.id = source.transactionId;
    transaction.total = source.transactionTotal;

    for (var i in source.transactionProducts) {
        var item = source.transactionProducts[i];
        transaction.items.push({
            product_id: item.id,
            sku: item.sku,
            qty: item.quantity,
            price_to: item.price
        });
    }

    transaction.shipping.price = source.transactionShipping;

    for (var i = source.transactionPaymentType.length - 1; i >= 0; i--) {
        var payment = source.transactionPaymentType[i];
        transaction.payments.push(payment.group);
    }

    return transaction;
};
