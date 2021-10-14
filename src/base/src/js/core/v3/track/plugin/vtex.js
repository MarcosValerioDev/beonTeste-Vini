"use strict";

export default function vtex(tracker) {
    this.tracker = tracker;

    this.initCartPool();

    return this;
}

vtex.prototype.initCartPool = function() {
    document.addEventListener(
        "beon.tracker.dispatch",
        function(event) {
            if (this.cartpool) {
                this.tracker.log("cart pool already running");
                return;
            }

            var eventType = event.detail.event;
            var context = event.detail.type;

            if (
                eventType != "pageview" ||
                ["cart", "transaction", "checkout"].indexOf(context) > -1
            ) {
                this.tracker.log(
                    "skip cart pool at " + context + " " + eventType
                );
                return;
            }

            this.cartpool = new vtexCartPool("debounce");
            this.tracker.log("cartPool init with debounce strategy");
        }.bind(this)
    );
};

var vtexCartPool = function(strategy) {
    this.version = "0.2.1";

    this.api =
        "/api/checkout/pub/orderForm/?{%22expectedOrderFormSections%22:[%22clientProfileData%22,%22clientPreferencesData%22,%22items%22]}";
    this.request = null;
    this.intervalDelay = 60000;
    this.intervalTimeout = null;
    this.debounceDelay = 1000;
    this.debounceTimeout = null;

    switch (strategy) {
        case "debounce":
            this.debounce();
            break;
        case "interval":
            this.interval();
            break;
    }

    return this;
};

vtexCartPool.prototype.buildRequest = function() {
    var request = new XMLHttpRequest();
    request.open("GET", this.api);
    request.setRequestHeader("Content-Type", "application/json");

    this.request = request;
};

vtexCartPool.prototype.fetch = function() {
    if (this.error) {
        return false;
    }

    this.buildRequest();
    this.request.addEventListener(
        "load",
        function(event) {
            var request = event.target;
            var response;

            if (request.readyState < 4 || request.status > 200) {
                throw new Error("request failed");
            }

            response = JSON.parse(request.response);

            this.parse(response);
        }.bind(this)
    );

    var trip = this.request.send();
    return trip;
};

vtexCartPool.prototype.parse = function(response) {
    var push = [];
    var cart = { shipping: {}, items: [] };
    var customer = {};

    // parse items
    if (response.items && response.items.length) {
        cart.items = [];
        for (i in response.items) {
            if (!response.items[i].hasOwnProperty("productId")) continue;

            cart.items.push({
                product_id: response.items[i].productId,
                sku: response.items[i].id,
                price_to: response.items[i].sellingPrice / 100,
                qty: response.items[i].quantity
            });
        }
    }

    // parse shipping data
    if (response.shippingData && response.shippingData.address) {
        cart.shipping.postcode = response.shippingData.address.postalCode;
    }

    // parse totals data
    if (response.totalizers) {
        for (i in response.totalizers) {
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
                  response.clientProfileData.lastName
              ].join(" ");
    }

    if (cart) {
        push.push([
            "track",
            "cart_update",
            null,
            function() {
                return cart;
            }
        ]);
    }

    if (customer) {
        push.push([
            "track",
            "customer_update",
            null,
            function() {
                return customer;
            }
        ]);
    }

    if (window.beon) {
        for (var i = push.length - 1; i >= 0; i--) {
            window.beon.apply(beon, push[i]);
        }
    }
};

vtexCartPool.prototype.handleFetch = function() {
    if (this.error) {
        return false;
    }

    try {
        var trip = this.fetch();
        return trip;
    } catch (e) {
        console.log("api fetch failed, stop pooling.");
        this.error = true;
    }
};

vtexCartPool.prototype.interval = function(immediate, timeout) {
    if (immediate) {
        this.handleFetch.bind(this);
    }

    this.intervalTimeout = window.setTimeout(
        function() {
            var handleState = this.handleFetch.bind(this);
            if (handleState) this.interval(immediate, timeout);
        }.bind(this),
        timeout || this.intervalDelay
    );
};

vtexCartPool.prototype.debounce = function(immediate, delay) {
    if (immediate) {
        this.handleFetch.bind(this);
    }

    document.addEventListener(
        "click",
        function() {
            if (this.debounceTimeout) {
                window.clearTimeout(this.debounceTimeout);
            }

            this.debounceTimeout = window.setTimeout(
                this.handleFetch.bind(this),
                delay || this.debounceDelay
            );
        }.bind(this)
    );
};
