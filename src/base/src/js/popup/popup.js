"use strict";

import ScheduleCall from "./scheduleCall";
import Chat from "./chat";

export default function BeonPopup(placeholder) {
  var me = this;

  this.root = jQuery(placeholder);

  // bind methods
  new ScheduleCall(this, this.root);
  new Chat(this, this.root);

  // set as initialized
  this.root.addClass("initialized");

  // bind form behaviour
  this.root.find(".beon-popup__head").on("click", function(event) {
    event.preventDefault();
    event.stopPropagation();

    me.root.find(".methods-list").fadeIn();
    me.root.find(".beon-popup__head").addClass("opened");

    me.scroll(".beon-popup__head");
  });

  this.root.find(".methods-list").on("click", "a", function(event) {
    event.preventDefault();
    event.stopPropagation();

    me.feedback(null);

    var method = jQuery(event.target).attr("href");
    toggleMethod(method);

    me.scroll(".beon-popup__head");
  });

  var toggleMethod = function(method) {
    me.root.find(".methods-container").show();
    me.root.find(".method-body").hide();

    var el = me.root.find(method);
    el.fadeIn();
    el.find("input")
      .get(0)
      .focus();

    me.root.trigger("method:toggle", [method]);
  };
}

BeonPopup.prototype.feedback = function(type) {
  if (type === undefined || type === null) {
    this.root.find(".feedback-container").fadeOut();
    return;
  }

  this.root.find(".feedback-container").show();
  this.root.find(".feedback-container .feedback").hide();
  this.root.find(".feedback-container .feedback-" + type).fadeIn();
};

BeonPopup.prototype.scroll = function(selector) {
  var referenceTop = jQuery(selector).offset().top,
    windowScroll = jQuery(window).scrollTop();

  jQuery({ myScrollTop: windowScroll }).animate(
    { myScrollTop: referenceTop - 10 },
    {
      duration: 600,
      easing: "linear",
      step: function(val) {
        $(window).scrollTop(val);
      }
    }
  );
};

BeonPopup.prototype.cookie = function(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(";");

  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }

  return null;
};

(function() {
  window.BeonPopup = BeonPopup;
})();
