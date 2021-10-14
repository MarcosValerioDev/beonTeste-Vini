"use strict";

import log from "./log";

export default function content(engine) {
    this.engine = engine;
    this.log = log("tracker", this.engine.debug);

    this.defaultMethods = {
        content: this.content.bind(this)
    };

    this.init();

    return this;
}

// init methods
content.prototype.init = function() {
    this.engine.registerMethods(this.defaultMethods);

    document.addEventListener(
        "beon.engine.create.after",
        function() {}.bind(this)
    );

    return this;
};

content.prototype.content = function() {
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var context = args.shift();
    var custom = args.shift();
    var params = [];

    var source = this.engine.dataLayer.parse(context, custom);

    if (context == "product") {
        if (source.sku)
            params.push("sku_pivot=" + (source.sku.shift() || null));
        if (source.product_id)
            params.push("product_id_pivot=" + source.product_id);
    }

    if (context == "catalog") {
        var trees = source.trees;
        if (trees && trees.length)
            for (var i = trees.length - 1; i >= 0; i--) {
                var tree = trees[i];

                params.push("trees_pivot[" + i + "][kind]=" + tree.kind);
                params.push("trees_pivot[" + i + "][tree_id]=" + tree.tree_id);
            }
    }

    if (!context) {
        return;
    }

    if (this.mode() == "preview") {
        context = "PREVIEW_" + context;
    }

    beon(
        "interaction",
        "context",
        context,
        params.length ? params.join("&") : null
    );

    this.log(context, params);
};

content.prototype.mode = function() {
    var modes = ["mockups", "preview", "prototype"];
    var mode = "normal";
    var rx = new RegExp("beon-(" + modes.join("|") + ")=(off|on)");
    var e = rx.exec(window.location.href);
    var cookie = this.engine.getCookie("beon-mode");

    // get new mode from URL
    if (e) if (e[2] == "on") mode = e[1];

    // if no mode on URL, check on cookie
    if (mode == "normal" && cookie) mode = cookie;

    // @todo limpar cookie antes de setar novamente

    document.cookie =
        "beon-mode=" + mode + "; path=/; domain=" + this.engine.cookiedomain;

    return mode;
};
