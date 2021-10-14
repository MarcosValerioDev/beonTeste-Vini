"use strict";

import transport from "./transport";

export default function engine() {
    this.env = "production";
    this.object = window[window["beonobject"]];
    this.tag = null;

    // methods
    this.allowedMethods = {};
    this.defaultMethods = {
        create: this.create.bind(this),
        send: this.send.bind(this)
        // beacon: this.beacon.bind(this)
    };

    // interactions
    this.interactionRepository = {};

    this.account = null;
    this.customer_id = null;
    this.session_id = null;

    this.headers = {};

    return this;
}

engine.prototype.init = function() {
    this.cookiedomain = this.getTagAttr("data-cookiedomain") || "";

    this.initMethods();
    this.loop();
};

engine.prototype.log = function(log) {
    if (this.env != "production") console.log(log);
};

// method register

engine.prototype.registerMethods = function(methods) {
    for (var i in methods) {
        this.registerMethod(i, methods[i]);
    }

    return this;
};

engine.prototype.registerMethod = function(name, method) {
    this.allowedMethods[name] = method;
    return this;
};

engine.prototype.initMethods = function() {
    return this.registerMethods(this.defaultMethods);
};

// interactions registry
// all interactions are kept in a collection to be acessed primary on hook triggering

engine.prototype.registerInteraction = function(interaction) {
    var id = interaction.id;
    this.interactionRepository[id] = interaction;

    return this.interactionRepository[id];
};

engine.prototype.getInteractionFromRegistry = function(id) {
    return this.interactionRepository[id] || null;
};

// events

engine.prototype.dispatchEvent = function(name, data, target) {
    var event = new CustomEvent("beon." + name, { detail: data });
    var target = target || document;

    target.dispatchEvent(event);

    return event;
};

/**
 * look for given hook on origin object
 */
engine.prototype.dispatchHook = function() {
    if (arguments.length < 2) return;

    var args = Array.prototype.slice.call(arguments);
    var hook = args.shift();
    var origin = args.shift();

    if (
        typeof origin != "object" ||
        !origin.hasOwnProperty("hooks") ||
        !origin.hooks.length
    ) {
        return null;
    }

    var hooks = origin.hooks
        .filter(function(i) {
            return i.type == hook;
        })
        .sort(function(a, b) {
            return a.order - b.order;
        });

    if (!hooks.length) {
        return null;
    }

    for (var i in hooks) {
        if (hooks[i].hasOwnProperty("script")) {
            var evaled = eval(hooks[i].script);
            if (typeof evaled == "function") {
                evaled.apply(hooks[i], arguments);
            }
        }
    }
};

// queue engine

engine.prototype.getQueue = function() {
    this.queue = this.queue || [];

    if (this.object.q.length) {
        for (var i in this.object.q) this.queue.push(this.object.q[i]);
        this.object.q = [];
    }

    return this;
};

engine.prototype.loop = function() {
    if ("undefined" == typeof this.interval) this.process();

    window.clearInterval(this.interval);
    this.interval = window.setInterval(this.process.bind(this), 500);

    return this;
};

engine.prototype.process = function() {
    this.getQueue();

    if (this.queue.length) {
        for (var i = 0; i < this.queue.length; i++) {
            var item = this.queue[i];
            var method;

            item = Array.prototype.slice.call(item);
            method = item.shift();

            if (this.allowedMethods.hasOwnProperty(method)) {
                this.allowedMethods[method].apply(
                    this.allowedMethods[method],
                    item
                );
                (this.processedQueue = this.processedQueue || []).push(item);
            } else {
                this.log("invalid method " + method);
            }

            delete this.queue[i];
        }
    }

    this.queue = [];

    return this;
};

// transport initialization

engine.prototype.transport = function(factory) {
    // if called as factory, return a new instance
    if (factory) {
        var instance = new transport(this);
        instance.setAccount(this.account);

        return instance;
    }

    // otherwise return transport instance singleton
    if ("undefined" == typeof this.transportInstance) {
        this.transportInstance = new transport(this);
        this.transportInstance.setAccount(this.account);
    }

    return this.transportInstance;
};

// Cookie methods

engine.prototype.setCookie = function(name, value, seconds) {
    var cookie = "",
        expires = "",
        path = "/",
        domain = this.cookiedomain;

    if (seconds) {
        var date = new Date();
        date.setTime(date.getTime() + seconds * 1000);
        expires = "; expires=" + date.toUTCString();
    }

    cookie =
        name + "=" + value + expires + "; domain=" + domain + "; path=" + path;

    document.cookie = cookie;

    return value;
};

engine.prototype.getCookie = function(name, cbIfNotExists) {
    var nameEQ = name + "=";
    var cookies = document.cookie.split(";");
    var value = null;

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];

        while (cookie.charAt(0) == " ")
            cookie = cookie.substring(1, cookie.length);

        if (cookie.indexOf(nameEQ) == 0) {
            value = cookie.substring(nameEQ.length, cookie.length);
            return value;
        }
    }

    // no cookie for you

    if ("function" == typeof cbIfNotExists) {
        return cbIfNotExists();
    }
};

// Header methods
// Store headers at engine level.
engine.prototype.setHeader = function(header, value) {
    this.headers[header] = value;
    return this.headers;
};

engine.prototype.getHeaders = function(header, value) {
    return this.headers;
};

// default id generator

engine.prototype.generateId = function() {
    var date, seed, rand, base, id;

    date = new Date();
    seed = Date.now();
    rand = parseInt(Math.random() * date.getMilliseconds() * 1000, 10);

    base = seed + rand;
    id = base.toString(36);

    return id;
};

// source tag methods

engine.prototype.getTag = function() {
    if (!this.tag) {
        var tag = document.getElementById("beon-" + window["beonobject"]);
        this.tag = tag ? tag : false;
    }

    return this.tag;
};

engine.prototype.getTagAttr = function(attr) {
    var tag = this.getTag();
    if (tag) {
        return tag.getAttribute(attr);
    }
};

engine.prototype.getSourceHost = function(format) {
    var tag, link, formated;

    tag = this.getTag();

    if (!tag) {
        this.log("cannot locate source tag");
        return false;
    }

    link = document.createElement("a");
    link.setAttribute("href", tag.src);

    if (format) {
        switch (format) {
            case "protocolwithports":
                formated =
                    link.protocol +
                    "//" +
                    link.hostname +
                    (link.port ? ":" + link.port : "");
                break;

            case "cookiedomain":
                formated = "." + link.hostname;
                break;
        }

        return formated;
    }

    return link;
};

engine.prototype.getAssetsBase = function() {
    return this.getSourceHost("protocolwithports") + "/" + this.account;
};

// engine methods

engine.prototype.create = function() {
    var client, token;

    if (arguments.length < 2) return;

    client = arguments[0];
    token = arguments[1];

    this.account = client;

    // get session cookies
    this.session_id = this.setCookie(
        "beon-session-id",
        this.getCookie(
            "beon-session-id",
            function() {
                return "sess_" + this.generateId(64);
            }.bind(this)
        ),
        5 * 24 * 3600
    );

    this.customer_id = this.setCookie(
        "beon-customer-id",
        this.getCookie(
            "beon-customer-id",
            function() {
                return "anon_" + this.generateId(32);
            }.bind(this)
        ),
        1 * 365 * 24 * 3600
    );

    // set headers
    this.setHeader("x-beon-client", client);
    this.setHeader("x-beon-token", token);
    this.setHeader("x-beon-session-id", this.session_id);
    this.setHeader("x-beon-customer-id", this.customer_id);

    this.dispatchEvent("engine.create.after", { engine: this });
};

engine.prototype.send = function() {
    if (arguments.length < 2) return;

    if (null == this.account) {
        throw new Error("account not initialized");
    }

    var args = Array.prototype.slice.call(arguments);
    var what = args.shift();
    var payload = args;

    if ("undefined" == typeof what) return;

    this.transport().send("/" + what, JSON.stringify(payload), function(
        err,
        xhr,
        res
    ) {
        if (err) return console.warn("beon fault: " + err);
    });
};

(function() {
    if (typeof window.CustomEvent === "function") return false;

    function CustomEvent(event, params) {
        params = params || {
            bubbles: false,
            cancelable: false,
            detail: undefined
        };
        var evt = document.createEvent("CustomEvent");
        evt.initCustomEvent(
            event,
            params.bubbles,
            params.cancelable,
            params.detail
        );
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
})();
