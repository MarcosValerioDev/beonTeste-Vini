"use strict";

import log from "./log";

// componente initializers
// import SliderInitializer from "../../slider/init";
import ShowcaseInitializer from "../../showcase/init";
import NotificationInitializer from "../../notification/init";
import ClockInitializer from "../../clock/init";
import MagicFlagInitializer from "../../magicflag/init";

export default function buddy(engine) {
  this.engine = engine;
  this.log = log("buddy", this.engine.debug);

  this.defaultPlacement = {
    selector: "body",
    method: "append",
  };

  this.defaultMethods = {
    interaction: this.interaction.bind(this),
  };

  // scope: account or global
  this.assets = {
    slidersjs: {
      type: "js",
      src: "/js/sliders.js",
      scope: "global",
      loaded: false,
      env: "all",
    },
    // clockjs: {
    //   type: "js",
    //   src: "/js/clock.js",
    //   scope: "global",
    //   loaded: false,
    //   env: "all",
    // },
    // notificationjs: {
    //   type: "js",
    //   src: "/js/notification.js",
    //   scope: "global",
    //   loaded: false,
    //   env: "all",
    // },
    customjs: {
      type: "js",
      src: "/js/custom.js",
      scope: "account",
      loaded: false,
      env: "all",
    },
    beoncss: {
      type: "css",
      src: "/css/beon.css",
      scope: "account",
      loaded: false,
      env: "production",
    },
    defaultcss: {
      type: "css",
      src: "/css/default.css",
      scope: "global",
      loaded: false,
      env: "all",
    },
  };

  this.injectionRetryCount = 120;
  this.injectionRetryDelay = 500; // milliseconds

  this.init();

  return this;
}

// init methods
buddy.prototype.init = function () {
  this.engine.registerMethods(this.defaultMethods);

  document.addEventListener(
    "beon.engine.create.after",
    this.initAssets.bind(this)
  );

  this.initResponseEvents();
  this.initInjectionEvents();
  this.initComponents();

  return this;
};

buddy.prototype.initAssets = function () {
  for (var i in this.assets) {
    var asset = this.assets[i];
    var base = this.engine.getApiBase("assets", asset.scope);

    this.log(base);

    if (asset.loaded) continue;

    if (
      this.engine.env === "development" &&
      asset.env !== "all" &&
      asset.env !== this.engine.env
    )
      continue;

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

buddy.prototype.buildStylesheet = function (name, href) {
  var element = document.createElement("link");
  element.rel = "stylesheet";
  element.type = "text/css";
  element.href = href;
  element.id = "beon-style-" + name;

  document.querySelector("head").appendChild(element);

  return element;
};

buddy.prototype.buildScript = function (name, src) {
  var element = document.createElement("script");
  element.type = "text/javascript";
  element.src = src;
  element.id = "beon-script-" + name;

  document.querySelector("head").appendChild(element);

  return element;
};

buddy.prototype.transport = function (api) {
  var instance = this.engine.transport().api(api);
  return instance;
};

// buddy exposed methods
buddy.prototype.interaction = function () {
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
    function (err, xhr, res) {
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

buddy.prototype.initResponseEvents = function () {
  document.addEventListener(
    "beon.engine.send.response",
    function (event) {
      try {
        var response = JSON.parse(event.detail.res);
        if (response.hasOwnProperty("regions")) {
          this.handleContentResponse(response);
        }
      } catch (error) {
        this.log(`invalid json response`);
      }
    }.bind(this)
  );
};

buddy.prototype.handleContentResponse = function (json) {
  var regions = json.regions || null;
  var elements = json.elements || null;

  // add listener that will handle region elements
  document.addEventListener(
    "beon.buddy.regions.handle.item.inject.success",
    function (event) {
      var regionId = event.detail.region._id;
      this.handleElementsFromRegion(regionId, elements);
    }.bind(this)
  );

  // handle regions
  this.handleRegions(regions, elements);
};

buddy.prototype.handleRegions = function (regions, elements) {
  if (!regions.length) {
    this.log("beon received an empty regions set.");
    return false;
  }

  this.engine.dispatchHook("regions.handle.collection.before", regions);
  this.engine.dispatchEvent("buddy.regions.handle.collection.before", regions);

  for (var i in regions) {
    new Promise(
      function (resolve, reject) {
        var region = regions[i];

        if (region.hasOwnProperty && region.hasOwnProperty("_id")) {
          // inject region only if it has elements
          var regionHasElements = (elements || []).find(function (element) {
            return element.region_id === region._id;
          });

          if (regionHasElements) {
            this.engine.dispatchEvent(
              "buddy.regions.handle.item.before",
              regions[i]
            );

            this.injectRegion(regions[i]);
          } else {
            this.log("empty region " + region._id);
          }
        }
      }.bind(this)
    );
  }

  // this.engine.dispatchHook("regions.handle.collection.after", regions);
};

buddy.prototype.handleElementsFromRegion = function (regionId, elements) {
  elements
    .filter(function (element) {
      return (
        element.hasOwnProperty &&
        element.hasOwnProperty("_id") &&
        element.region_id &&
        element.region_id == regionId
      );
    })
    .sort(function (a, b) {
      return a.order - b.order;
    })
    .forEach(
      function (element) {
        this.injectElement(element);
      }.bind(this)
    );
};

buddy.prototype.initInjectionEvents = function () {
  document.addEventListener(
    "beon.buddy.node.inject.fail",
    this.injectNodeRetry.bind(this)
  );
};

buddy.prototype.injectRegion = function (region) {
  var placement = region.placement || null;
  var _id = region._id || null;

  if (!_id || !placement) return this.log("invalid region item", region);

  var container;
  var regionElementId = "beon-region-" + _id;

  // look for region
  var regionOnDocument = document.querySelector("#" + regionElementId);

  if (regionOnDocument) {
    container = regionOnDocument;
  } else {
    container = document.createElement(placement.container || "div");
    container.setAttribute("id", regionElementId);
    container.setAttribute("class", "beon-region");

    container.addEventListener(
      "beon.buddy.node.inject.success",
      function () {
        this.engine.dispatchEvent("buddy.regions.handle.item.inject.success", {
          region: region,
        });
      }.bind(this)
    );
  }

  this.injectNode("region", _id, container, placement, true, true);
};

buddy.prototype.injectElement = function (element) {
  return new Promise(
    function (resolve, reject) {
      var _id = element._id || null;

      if (!_id) return this.log("invalid element item", element);

      // region placement
      var placement = {
        selector: "#beon-region-" + element.region_id,
        operation: "append",
      };

      // remove element if it already exists
      // a new version is comming
      var elementId = "beon-element-" + _id;

      var elementOnPage = document.querySelector("#" + elementId);
      if (elementOnPage) {
        elementOnPage.parentNode.removeChild(elementOnPage);
      }

      // create element itself
      var container = document.createElement("div");
      container.setAttribute("id", elementId);
      container.setAttribute("data-type", element.template.name);
      container.setAttribute("class", "beon-container");
      container.innerHTML = element.output;

      // bind element listeners
      container.addEventListener("click", this.handleInteraction.bind(this));

      this.bindEventAnchor(container);

      // linten success event
      container.addEventListener(
        "beon.buddy.node.inject.success",
        function (event) {
          this.engine.dispatchEvent(
            "buddy.elements.handle.item.inject.success",
            {
              element: element,
              container: container,
            }
          );
        }.bind(this)
      );

      resolve(this.injectNode("element", _id, container, placement, false));
    }.bind(this)
  );
};

buddy.prototype.injectNode = function (
  type,
  id,
  node,
  placement,
  retryOnFailure,
  removeConflicts
) {
  return new Promise(
    function (resolve, reject) {
      this.log(`injectNode promise set for ${type} ${id}`);
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
            removeConflicts: removeConflicts,
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
        conflicting.parentNode.removeChild(conflicting);

        this.log("conflict removed " + node.getAttribute("id"));
      } else {
        // this.log(
        //   "conflicts unhandled " +
        //     node.getAttribute("id") +
        //     " - " +
        //     removeConflicts
        // );
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
        removeConflicts: removeConflicts,
      });

      // node event
      this.engine.dispatchEvent("buddy.node.inject.success", null, node);

      resolve(node);
    }.bind(this)
  );
};

buddy.prototype.injectNodeRetry = function (event) {
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
      function () {
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
/**
 * This handler deals with single event anchors contained on elements output.
 * Event anchors must be declared with data-track attribute and
 * should have the data-event attribute, an array with all event markers.
 * If an event anchor's parent contains data-event, its content should be merged with event anchor data-event.
 */
buddy.prototype.bindEventAnchor = function (container) {
  this.log(`binding event handlers on ${container}`);

  container.querySelectorAll("[data-track]:not([data-bind=true])").forEach(
    function (el) {
      this.log(`binding ${el}`);
      el.setAttribute("data-bind", true);

      el.addEventListener(
        el.getAttribute("data-track"),
        this.handleEventAnchor.bind(this)
      );
    }.bind(this)
  );
};

buddy.prototype.handleEventAnchor = function (event) {
  var dom = new this.dom();

  try {
    var eventSource = event.target || event.eventSource || event.toElement;
    var eventAnchor;

    var dataLayerEvent = {
      event: "beon_gaevent",
      eventAction: undefined,
      eventLabel: undefined,
      eventValue: undefined,
    };

    // validate event source
    if (!eventSource) {
      throw new Error(`handling unknown event source ${eventSource}`);
    }

    eventAnchor = dom.parent(eventSource, "[data-track]");

    // validate event anchor
    if (!eventAnchor) {
      throw new Error(`handling unknown event anchor ${eventAnchor}`);
    }

    var eventDetails = eventAnchor.getAttribute("data-event");
    eventDetails = eventDetails ? JSON.parse(eventDetails) : [];

    dataLayerEvent.eventAction = eventDetails.shift();
    dataLayerEvent.eventLabel = eventDetails.shift();
    dataLayerEvent.eventValue = eventDetails.shift();

    // check for event root element
    var eventInteractionRoot = dom.parent(eventAnchor, "[data-event-root]");

    if (eventInteractionRoot) {
      var eventRootDetails =
        eventInteractionRoot.getAttribute("data-event-root");
      eventRootDetails = eventRootDetails ? JSON.parse(eventRootDetails) : [];

      var eventRootAction = eventRootDetails.shift();
      var eventRootLabel = eventRootDetails.shift();
      var eventRootValue = eventRootDetails.shift();

      if (!dataLayerEvent.eventAction && eventRootAction)
        dataLayerEvent.eventAction = eventRootAction;
      if (!dataLayerEvent.eventLabel && eventRootLabel)
        dataLayerEvent.eventLabel = eventRootLabel;
      if (!dataLayerEvent.eventValue && eventRootValue)
        dataLayerEvent.eventValue = eventRootValue;
    }

    if (!window.dataLayer) {
      this.log(`warning: dataLayer not found`);
    }

    (window.dataLayer || []).push(dataLayerEvent);

    return dataLayerEvent;
  } catch (e) {
    this.log(e);
    this.log(event);
    return;
  }
};

/**
 * Legacy method
 */
buddy.prototype.handleInteraction = function (event) {
  var target = event.target;
  var anchor = null;
  var interactionRoot = null;
  var interactionContainer = null;
  var interactionItem = null;
  var interaction = {};

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

    // probably on modern track
    if (!interactionItem) {
      return;
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

    // this.dispatchActionHooks(interaction, event);

    // return beon("send", "event", "interaction", interaction);
    return;
  }
};

buddy.prototype.dispatchGAEvent = function (anchor) {
  var dataLayer, event;

  var part = function (part, href) {
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

buddy.prototype.dispatchActionHooks = function (interaction, event) {
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
        origin: event,
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
        origin: event,
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

// componentes initializers
buddy.prototype.initComponents = function () {
  // new SliderInitializer();
  new ShowcaseInitializer();
  new NotificationInitializer();
  new ClockInitializer();
  new MagicFlagInitializer();
};

// DOM utils
buddy.prototype.dom = function () {
  return this;
};

buddy.prototype.dom.prototype.collectionHas = function (a, b) {
  for (var i = 0, len = a.length; i < len; i++) {
    if (a[i] == b) return true;
  }
  return false;
};

buddy.prototype.dom.prototype.parent = function (el, parentSelector) {
  var all = document.querySelectorAll(parentSelector);
  var cur = el.parentNode;

  while (cur && !this.collectionHas(all, cur)) {
    cur = cur.parentNode;
  }

  return cur;
};

buddy.prototype.dom.prototype.hasClass = function (el, classname) {
  var classes = el.getAttribute("class");
  var classesCollection = classes != null ? classes.split(" ") : [];
  return this.collectionHas(classesCollection, classname);
};
