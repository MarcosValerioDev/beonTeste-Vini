"use strict";

import NotificationComponent from "./notification";

var NotificationInitializer = function () {
  this.componentRootSelector = ".beon-notificacao";

  // initialize sliders already on page
  this.initComponents();

  // bind events to initialize sliders real time
  this.bindEvents();

  return this;
};

export default NotificationInitializer;

NotificationInitializer.prototype.bindEvents = function () {
  document.addEventListener("DOMContentLoaded", this.initComponents.bind(this));
  document.addEventListener(
    "beon.buddy.elements.handle.item.inject.success",
    this.initComponentFromInjection.bind(this)
  );
  document.addEventListener(
    "beon.buddy.inject.after",
    this.initComponentFromInjection.bind(this)
  );
};

NotificationInitializer.prototype.initComponents = function () {
  var components = document.querySelectorAll(
    this.componentRootSelector + ":not(.initialized)"
  );

  Array.prototype.slice.call(components).forEach(
    function (root) {
      this.initComponent(root);
    }.bind(this)
  );
};

NotificationInitializer.prototype.initComponentFromInjection = function (
  event
) {
  var container = event.detail.container;
  var root = container.querySelector(
    this.componentRootSelector + ":not(.initialized)"
  );

  if (root) {
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        function () {
          this.initComponent(root);
        }.bind(this)
      );
    } else {
      this.initComponent(root);
    }
  }
};

NotificationInitializer.prototype.initComponent = function (root) {
  try {
    var rawConfig = root.getAttribute("data-config");
    var config = JSON.parse(rawConfig);

    new Promise(function (resolve, reject) {
      resolve(new NotificationComponent(root, config));
    });
  } catch (e) {
    console.log("failed to build component " + this.componentRootSelector, e);
  }
};

(function () {
  if (window) window.BeonNotificationInitializer = NotificationInitializer;
})();
