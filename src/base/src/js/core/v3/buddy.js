"use strict";

import log from "./log";

export default function buddy(engine) {
  this.engine = engine;
  this.log = log("buddy", this.engine.debug);

  this.defaultPlacement = {
    selector: "body",
    method: "append"
  };

  this.defaultMethods = {
    interaction: this.interaction.bind(this)
  };

  this.assets = {
    showcasejs: {
      type: "js",
      src: "/js/showcase.js",
      scope: "global",
      loaded: false
    },
    // bannerjs: {
    //     type: "js",
    //     src: "/js/banner.js",
    //     loaded: false
    // },
    // popupjs: {
    //     type: "js",
    //     src: "/js/popup.js",
    //     loaded: false
    // },
    customjs: {
      type: "js",
      src: "/js/custom.js",
      scope: "account",
      loaded: false
    },
    beoncss: {
      type: "css",
      src: "/css/beon.css",
      scope: "account",
      loaded: false
    }
  };

  this.injectionRetryCount = 200;
  this.injectionRetryDelay = 500; // milliseconds

  this.init();

  return this;
}

// init methods
buddy.prototype.init = function() {
  this.engine.registerMethods(this.defaultMethods);

  document.addEventListener(
    "beon.engine.create.after",
    this.initAssets.bind(this)
  );

  this.initInjectionEvents();

  return this;
};

buddy.prototype.initAssets = function() {
  for (var i in this.assets) {
    var asset = this.assets[i];
    var base = this.engine.getApiBase("assets", asset.scope);

    this.log(base);

    if (asset.loaded) continue;

    switch (asset.type) {
      case "js":
        this.buildScript(i, base + asset.src);
        break;

      case "css":
        this.buildStylesheet(i, base + asset.src);
        break;
    }

    asset.loaded = true;
  }

  return this;
};

buddy.prototype.buildStylesheet = function(name, href) {
  var element = document.createElement("link");
  element.rel = "stylesheet";
  element.type = "text/css";
  element.href = href;
  element.id = "beon-style-" + name;

  document.querySelector("head").appendChild(element);

  return element;
};

buddy.prototype.buildScript = function(name, src) {
  var element = document.createElement("script");
  element.type = "text/javascript";
  element.src = src;
  element.id = "beon-script-" + name;

  document.querySelector("head").appendChild(element);

  return element;
};

buddy.prototype.transport = function(api) {
  var instance = this.engine.transport().api(api);
  return instance;
};

// buddy exposed methods
buddy.prototype.interaction = function() {
  var transport = this.transport("content");
  var args = Array.prototype.slice.call(arguments);
  var url = null;

  var type = args.shift();
  var id = args.shift();
  var params = args.shift();

  if (typeof type == "undefined" || typeof id == "undefined") {
    this.log("invalid params at interaction call");
    return;
  }

  // before interactions call, init assets
  this.initAssets();

  url = ["content", type, id].join("/");

  transport.get(
    url,
    params,
    function(err, xhr, res) {
      if (err) return console.warn("beon interaction fault: " + err);

      var json = JSON.parse(res);

      if (typeof json !== "object" || json == null) {
        return this.log("beon responded with invalid json");
      }

      this.handleContentResponse(json);
    }.bind(this)
  );
};

// content response handling

buddy.prototype.handleContentResponse = function(json) {
  var regions = json.regions || null;
  var elements = json.elements || null;

  // add listener that will handle region elements
  document.addEventListener(
    "beon.buddy.regions.handle.item.inject.success",
    function(event) {
      var regionId = event.detail.region._id;
      this.handleElementsFromRegion(regionId, elements);
    }.bind(this)
  );

  // handle regions
  this.handleRegions(regions);
};

buddy.prototype.handleRegions = function(regions) {
  if (!regions.length) {
    this.log("beon received an empty regions set.");
    return false;
  }

  this.engine.dispatchHook("regions.handle.collection.before", regions);
  this.engine.dispatchEvent("buddy.regions.handle.collection.before", regions);

  for (var i in regions) {
    if (regions[i].hasOwnProperty && regions[i].hasOwnProperty("_id")) {
      this.engine.dispatchEvent("buddy.regions.handle.item.before", regions[i]);
      this.injectRegion(regions[i]);
    }
  }

  this.engine.dispatchHook("regions.handle.collection.after", regions);
};

buddy.prototype.handleElementsFromRegion = function(regionId, elements) {
  for (var i in elements) {
    var element = elements[i];

    if (element.hasOwnProperty && element.hasOwnProperty("_id"))
      if (element.region_id && element.region_id == regionId)
        this.injectElement(element);
  }
};

buddy.prototype.initInjectionEvents = function() {
  document.addEventListener(
    "beon.buddy.node.inject.fail",
    this.injectNodeRetry.bind(this)
  );
};

buddy.prototype.injectRegion = function(region) {
  var placement = region.placement || null;
  var _id = region._id || null;

  if (!_id || !placement) return this.log("invalid region item", region);

  var container = document.createElement(placement.container || "div");
  container.setAttribute("id", "beon-region-" + _id);
  container.setAttribute("class", "beon-region");

  container.addEventListener(
    "beon.buddy.node.inject.success",
    function() {
      this.engine.dispatchEvent("buddy.regions.handle.item.inject.success", {
        region: region
      });
    }.bind(this)
  );

  this.injectNode("region", _id, container, placement, true);
};

buddy.prototype.injectElement = function(element) {
  var _id = element._id || null;

  if (!_id) return this.log("invalid element item", element);

  // region placement
  var placement = {
    selector: "#beon-region-" + element.region_id,
    operation: "append"
  };

  // create element itself
  var container = document.createElement("div");
  container.setAttribute("id", "beon-element-" + _id);
  container.setAttribute("data-type", element.template.name);
  container.setAttribute("class", "beon-container");
  container.innerHTML = element.output;

  // bind element listeners
  container.addEventListener("click", this.handleInteraction.bind(this));

  // linten success event
  container.addEventListener(
    "beon.buddy.node.inject.success",
    function(event) {
      this.engine.dispatchEvent("buddy.elements.handle.item.inject.success", {
        element: element,
        container: container
      });
    }.bind(this)
  );

  this.injectNode("element", _id, container, placement, false);
};

buddy.prototype.injectNode = function(
  type,
  id,
  node,
  placement,
  retryOnFailure,
  removeConflicts
) {
  var operation = placement.operation || null;
  var selector = placement.selector || null;
  var replace = placement.replace || false;

  if (!operation || !selector) {
    this.log(placement);
    throw new Error("insuficient arguments to place node on DOM");
  }

  var reference = document.querySelector(placement.selector);

  if (!reference) {
    this.log("node insertion point not found at " + placement.selector);

    if (retryOnFailure) {
      this.log("sending retry event");

      this.engine.dispatchEvent("buddy.node.inject.fail", {
        reason: "placement not found",
        type: type,
        id: id,
        node: node,
        placement: placement,
        retryOnFailure: retryOnFailure,
        removeConflicts: removeConflicts
      });
    } else {
      throw new Error("node injection fail");
    }

    return false;
  }

  // if node has an id, and this id conflicts with something on page
  if (
    node.getAttribute("id") &&
    document.querySelector("#" + node.getAttribute("id")) &&
    removeConflicts
  ) {
    var conflicting = document.querySelector("#" + node.getAttribute("id"));
    conflicting.parendNode.removeChild(conflicting);

    this.log("conflict removed " + node.getAttribute("id"));
  }

  // remove placement content before other appends
  if ((operation == "append" || operation == "prepend") && replace) {
    reference.innerHTML = "";
    operation = "append";
  }

  switch (operation) {
    case "append":
      reference.appendChild(node);
      break;
    case "prepend":
      reference.insertBefore(node, reference.firstChild);
      break;

    case "before":
      reference.parentNode.insertBefore(node, reference);
      break;
    case "after":
      reference.parentNode.insertBefore(node, reference.nextSibling);
      break;

    default:
      this.log("invalid insertion method");
  }

  // remove placement reference
  if ((operation == "before" || operation == "after") && replace) {
    reference.parentNode.removeChild(reference);
  }

  // global event
  this.engine.dispatchEvent("buddy.node.inject.success", {
    type: type,
    id: id,
    node: node,
    placement: placement,
    retryOnFailure: retryOnFailure,
    removeConflicts: removeConflicts
  });

  // node event
  this.engine.dispatchEvent("buddy.node.inject.success", null, node);

  return node;
};

buddy.prototype.injectNodeRetry = function(event) {
  var id = event.detail.id;
  var node = event.detail.node;
  var placement = event.detail.placement;

  this.log("retrying node " + id);

  placement.inject_count = placement.inject_count || 1;
  placement.inject_count++;

  if (placement.inject_count > this.injectionRetryCount) {
    this.log("injection count exceeded limit", node);
  } else {
    window.setTimeout(
      function() {
        this.injectNode(
          event.detail.type,
          event.detail.id,
          event.detail.node,
          event.detail.placement,
          event.detail.retryOnFailure,
          event.detail.removeConflicts
        );
      }.bind(this),
      this.injectionRetryDelay
    );
  }
};

// handle users interactions on elements

buddy.prototype.handleInteraction = function(event) {
  var target = event.target;
  var anchor = null;
  var interactionRoot = null;
  var interactionContainer = null;
  var interactionItem = null;
  var interaction = {};
  var interactionRegistry;
  var dom = new this.dom();

  // notify beon about an interaction activation
  if (target.nodeName.toUpperCase() != "A") {
    anchor = dom.parent(target, ".beon-interaction__item a") || null;
  } else {
    anchor = target;
  }

  if (anchor != null) {
    if (!dom.hasClass(anchor, "beon-interaction__item")) {
      interactionItem = dom.parent(anchor, ".beon-interaction__item");
    } else {
      interactionItem = anchor;
    }

    interactionRoot = dom.parent(interactionItem, ".beon-interaction");
    interactionContainer = interactionRoot.parentNode;

    // source props
    interaction.id = interactionRoot.getAttribute("id");
    interaction.root = interactionRoot;
    interaction.item = interactionItem;
    interaction.target = anchor;

    // product props
    interaction.hit = target.getAttribute("class");
    interaction.type = interactionContainer.getAttribute("data-type");
    interaction.sku = interactionItem.getAttribute("data-product-sku");
    interaction.product_id = interactionItem.getAttribute("data-product-id");
    interaction.timestamp = Date.now();

    if (anchor.hasAttribute("data-action")) {
      interaction.action = anchor.getAttribute("data-action");
    }

    if (/event-category/.test(anchor.getAttribute("href"))) {
      this.dispatchGAEvent(anchor);
    }

    this.dispatchActionHooks(interaction, event);

    return beon("send", "event", "interaction", interaction);
  }
};

buddy.prototype.dispatchGAEvent = function(anchor) {
  var dataLayer, event;

  var part = function(part, href) {
    var parts = new RegExp(part + "=(.+?)(&|$)", "i").exec(href);

    if (parts) {
      return parts[1];
    }

    return null;
  };

  event = { event: "beon_gaevent" };

  event.eventCategory = part("event-category", anchor.getAttribute("href"));
  event.eventAction = part("event-action", anchor.getAttribute("href"));
  event.eventLabel = part("event-label", anchor.getAttribute("href"));

  dataLayer = window.dataLayer || [];
  dataLayer.push(event);

  return;
};

buddy.prototype.dispatchActionHooks = function(interaction, event) {
  var interactionRegistry = this.engine.getInteractionFromRegistry(
    interaction.id
  );

  if (!interactionRegistry) {
    throw new Error("Given interaction do not have an registry");
  }

  switch (interaction.action) {
    case "buy":
      this.engine.dispatchEvent("interaction.handle.buy", {
        interaction: interaction,
        origin: event
      });
      this.engine.dispatchHook(
        "interaction.handle.buy",
        interactionRegistry,
        interaction,
        event
      );
      break;

    case "details":
      this.engine.dispatchEvent("interaction.handle.details", {
        interaction: interaction,
        origin: event
      });
      this.engine.dispatchHook(
        "interaction.handle.details",
        interactionRegistry,
        interaction,
        event
      );
      break;
  }
};

// DOM utils
buddy.prototype.dom = function() {
  return this;
};

buddy.prototype.dom.prototype.collectionHas = function(a, b) {
  for (var i = 0, len = a.length; i < len; i++) {
    if (a[i] == b) return true;
  }
  return false;
};

buddy.prototype.dom.prototype.parent = function(el, parentSelector) {
  var all = document.querySelectorAll(parentSelector);
  var cur = el.parentNode;

  while (cur && !this.collectionHas(all, cur)) {
    cur = cur.parentNode;
  }

  return cur;
};

buddy.prototype.dom.prototype.hasClass = function(el, classname) {
  var classes = el.getAttribute("class");
  var classesCollection = classes != null ? classes.split(" ") : [];
  return this.collectionHas(classesCollection, classname);
};
