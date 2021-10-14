var dom = require("../helpers/dom.js");

var NotificationComponent = function (root, config) {
  this.root = root;

  this.options = {
    is_dismissed: false,
    uuid: undefined,
  };

  this.config = Object.assign(
    {
      auto_dismiss: 5, // hide after n seconds
      allow_dismiss: true, // allow user to dismiss
      allow_reopen: true, // allow user to reopen after dismiss
      reopen_after: 0, // when dismissed, reopen after n impressions
      dismiss_label: "Dispensar",
      dismiss_style: "text", // text to inline label, times to x icon on right upper corner
    },
    config
  );

  this.init();

  return this;
};

NotificationComponent.prototype.init = function () {
  if (!this.root) return;

  dom.addClass(this.root, "initialized");

  this.options.uuid = this.root.parentNode.id;

  this.initStoredData();
  this.initDismissBehaviour();
  this.initCtaClose();
};

/**
 * Looks for stored data about this notification by its ID.
 * Stored data contains status information, like if it is
 * dismissed, or how many impressions this componente holds.
 */
NotificationComponent.prototype.initStoredData = function () {
  if (window.localStorage) {
    this.options.is_dismissed =
      window.localStorage.getItem([this.options.uuid, "dismissed"].join("_")) ||
      false;
  } else {
    console.warn("storage unreachable");
  }
};

NotificationComponent.prototype.setStoredData = function (prop, value) {
  if (window.localStorage) {
    window.localStorage.setItem([this.options.uuid, prop].join("_"), value);
  } else {
    console.warn("storage unreachable");
  }
};

/**
 * Init dismiss behaviour.
 * If this notification allow dismisses, append a link to it.
 * If is auto-dismissed, set a times.
 */
NotificationComponent.prototype.initDismissBehaviour = function () {
  if (this.config.allow_dismiss) {
    this.buildDismissControl();
  }

  if (this.config.auto_dismiss > 0) {
    this.initAutoDismiss();
  }

  if (this.options.is_dismissed) {
    return this.dismiss();
  } else {
    return this.show();
  }
};

NotificationComponent.prototype.buildDismissControl = function () {
  var control = document.createElement("span");
  control.innerText = this.config.dismiss_label;
  control.className = [
    "beon-notificacao__dismiss",
    "beon-notificacao__dismiss--" + this.config.dismiss_style,
  ].join(" ");

  this.root.append(control);

  control.addEventListener("click", this.dismiss.bind(this));
};

NotificationComponent.prototype.initAutoDismiss = function () {
  this.setDismissTimeout(this.config.auto_dismiss);

  this.root.addEventListener(
    "mouseenter",
    function (event) {
      window.clearTimeout(this.root_mouseover_debounce);
      this.root_mouseover_debounce = window.setTimeout(
        function () {
          this.unsetDismissTimeout();
        }.bind(this),
        300
      );
    }.bind(this)
  );

  this.root.addEventListener(
    "mouseleave",
    function (event) {
      window.clearTimeout(this.root_mouseout_debounce);
      this.root_mouseout_debounce = window.setTimeout(
        function () {
          if (!this.config.allow_dismiss) {
            this.setDismissTimeout(this.config.auto_dismiss);
          }
        }.bind(this),
        300
      );
    }.bind(this)
  );
};

NotificationComponent.prototype.setDismissTimeout = function (timeout) {
  this.options.dismiss_timeout = window.setTimeout(
    this.dismiss.bind(this),
    // sums animation time
    timeout * 1000 + 2
  );
};

NotificationComponent.prototype.unsetDismissTimeout = function () {
  // unset only if user can dismiss later
  window.clearTimeout(this.options.dismiss_timeout);
};

NotificationComponent.prototype.dismiss = function (event) {
  dom.addClass(this.root, "beon-notificacao--dismissed");
  dom.removeClass(this.root, "beon-notificacao--opened");
  dom.display(this.root, "none");

  // if there is an event, user triggered this
  if (event) {
    this.setStoredData("dismissed", true);
  }
};

NotificationComponent.prototype.show = function () {
  if (dom.hasClass(this.root, "bn--none")) {
    this.dismiss();
  } else {
    dom.removeClass(this.root, "beon-notificacao--dismissed");
    dom.addClass(this.root, "beon-notificacao--opened");
    dom.display(this.root, "block");
  }
};

NotificationComponent.prototype.initCtaClose = function () {
  var cta = this.root.querySelector(".beon-notificacao__cta");

  if (cta && cta.href.indexOf("#close") > -1) {
    cta.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        event.stopPropagation();

        this.dismiss();
      }.bind(this)
    );
  }
};

NotificationComponent.prototype.display = function (el, value) {
  window.clearTimeout(this.options.displayTimeout);

  this.options.displayTimeout = window.setTimeout(() => {
    dom.display(el, value);
  }, 1000);
};

export default NotificationComponent;
