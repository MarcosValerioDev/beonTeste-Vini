var dom = require("../helpers/dom.js");

var ClockComponent = function (root, config) {
  this.root = root;

  this.options = {
    tick: false, // indicates that clock is ticking
    ended: false, // indicates when clock has ended
    urgent: false, // indicates when clock reched urgent limit
    live: false, // indicates if clock is live
  };

  this.config = Object.assign(
    {
      type: "dates",
      interval: null,
      start_date: null,
      end_date: null,
      urgent_date: null,
      headline: "",
      support_text: "",
      hideOnEnd: false,
      aggregateDays: false,
    },
    config
  );

  this.dates = {
    now: null,
    start: null,
    end: null,
    urgent: null,
  };

  this.fragments = {
    d: null,
    H: null,
    i: null,
    s: null,
  };

  this.interval = null;

  this.init();

  return this;
};

ClockComponent.prototype.init = function () {
  dom.addClass(this.root, "initialized");

  this.initDates();
  this.initFragments();
  this.initClock();
  this.start();
};

ClockComponent.prototype.initDates = function () {
  this.dates.now = new Date();

  // if start date is defined
  if (this.config.type === "dates") {
    this.dates.start = new Date(this.config.start_date);
    this.dates.end = new Date(this.config.end_date);
    this.dates.urgent = new Date(this.config.urgent_date);
  }

  // relative dates
  if (this.config.type === "relative") {
    // current support: today
    var dayStart = new Date();
    dayStart.setHours(0);
    dayStart.setMinutes(0);
    dayStart.setSeconds(0);

    var dayEnd = new Date();
    dayEnd.setHours(23);
    dayEnd.setMinutes(59);
    dayEnd.setSeconds(59);

    this.dates.start = new Date(dayStart);
    this.dates.end = new Date(dayEnd);
    this.dates.urgent = new Date(dayEnd);
  }

  // if interval clock
  if (this.config.type === "interval" && this.config.interval) {
    // load cookie with defined dates for this user
    var datesCookieName = ["bn", this.root.id].join("-");

    var datesCookieParts = ("; " + document.cookie).split(
      datesCookieName + "="
    );

    var datesCookieValue =
      datesCookieParts.length === 2
        ? datesCookieParts.pop().split(";").shift()
        : null;

    var startDate, endDate;

    if (datesCookieValue) {
      var cookieDates = datesCookieValue.split("/");

      startDate = new Date(parseInt(cookieDates[0], 10));
      endDate = new Date(parseInt(cookieDates[1], 10));
    } else {
      startDate = new Date();
      endDate = new Date(Date.now() + this.config.interval * 60 * 1000);

      document.cookie =
        datesCookieName +
        "=" +
        [startDate.getTime(), endDate.getTime()].join("/") +
        "; SameSite=Lax; path=/";
    }

    this.dates.start = new Date(startDate);
    this.dates.end = new Date(endDate);
    this.dates.urgent = new Date(endDate);
  }

  this.options.live = true;

  if (this.notStartedYet()) {
    // console.log(`not started`);
    this.options.tick = false;
    this.options.live = false;

    this.hideAssociate("not-started");
    this.hide();
  } else if (this.limitReached()) {
    // console.log(`ended`);
    this.options.tick = false;
    this.options.ended = true;

    this.hideOnEnd();
  }
};

ClockComponent.prototype.initFragments = function () {
  this.fragments = {
    d: this.root.querySelector(".beon-clock__fragment-d, .bn-clock__frag-d"),
    H: this.root.querySelector(".beon-clock__fragment-H, .bn-clock__frag-H"),
    i: this.root.querySelector(".beon-clock__fragment-i, .bn-clock__frag-i"),
    s: this.root.querySelector(".beon-clock__fragment-s, .bn-clock__frag-s"),
  };

  if (this.config.aggregateDays) {
    dom.addClass(this.root, "beon-clock--without-days");
    this.fragments.d.style.display = "none";
  }
};

ClockComponent.prototype.initClock = function () {
  this.updateFragments();
};

/**
 * Time control
 */

// diff now and end
ClockComponent.prototype.diff = function (d1, d2) {
  var miliseconds, seconds, diff;

  diff = { d: 0, H: 0, i: 0, s: 0 };

  if (this.limitReached()) {
    this.end();
    this.dates.diff = diff;

    return diff;
  }

  miliseconds = d1.getTime() - d2.getTime();

  if (miliseconds > 0) {
    seconds = miliseconds / 1000;
    diff.d = Math.floor(seconds / 86400);
    diff.H = Math.floor((seconds - diff.d * 86400) / 3600);
    diff.i = Math.floor((seconds - diff.d * 86400 - diff.H * 3600) / 60);
    diff.s = Math.floor(seconds - diff.d * 86400 - diff.H * 3600 - diff.i * 60);

    if (this.config.aggregateDays) {
      diff.H = diff.H + diff.d * 24;
      diff.d = 0;
    }
  }

  this.dates.diff = diff;

  return diff;
};

ClockComponent.prototype.notStartedYet = function () {
  // walk now 100 milliseconds to prevent microsecond bug
  var now = this.dates.now.getTime() / 1000 + 100;
  var start = this.dates.start.getTime() / 1000;

  return start > now;
};

ClockComponent.prototype.limitReached = function () {
  var now = this.dates.now.getTime();
  var end = this.dates.end.getTime();

  return now > end;
};

ClockComponent.prototype.updateNow = function () {
  this.dates.now = new Date();
};

ClockComponent.prototype.urgentReached = function () {
  if (this.dates.urgent) {
    var now = this.dates.now.getTime();
    var urgent = this.dates.urgent.getTime();

    return now > urgent;
  }

  return 0;
};

/**
 * Clock control
 */

ClockComponent.prototype.updateFragments = function () {
  var diff = Object.entries(this.diff(this.dates.end, this.dates.now));

  for (var i = 0; i < diff.length; i++) {
    var [frag, value] = diff[i];
    this.setFragment(frag, value);
  }
};

ClockComponent.prototype.setFragment = function (frag, value) {
  var formatted;

  if (
    (this.config.aggregateDays && frag === "H") ||
    (!this.config.aggregateDays && frag === "d")
  ) {
    formatted = value.toString().length <= 2 ? this.pad(value, 2, "0") : value;
  } else {
    formatted = this.pad(value, 2, "0");
  }

  this.fragments[frag].innerText = formatted;
};

ClockComponent.prototype.tick = function () {
  if (!this.options.tick) {
    return this.stop();
  }

  this.updateNow();
  this.updateFragments();

  if (!this.options.urgent && this.urgentReached()) {
    this.urgent();
  }

  if (this.limitReached()) {
    this.end();
  }
};

ClockComponent.prototype.start = function () {
  if (!this.options.live) {
    return this.stop();
  }

  this.interval = window.setInterval(this.tick.bind(this), 1000);
  this.options.tick = true;
};

ClockComponent.prototype.stop = function () {
  window.clearInterval(this.interval);
  this.options.tick = false;
};

ClockComponent.prototype.end = function () {
  this.stop();
  this.ended = true;
  dom.addClass(this.root, "ended");

  this.hideOnEnd();
};

ClockComponent.prototype.urgent = function () {
  this.options.urgent = true;
  dom.addClass(this.root, "urgent");
};

ClockComponent.prototype.hideOnEnd = function () {
  if (this.ended && this.config.hideOnEnd) {
    this.hideAssociate("ended");
    this.hide();
    dom.addClass(this.root, "bn--clock-ended");
  }
};

// clock associate elements
ClockComponent.prototype.getAssociate = function () {
  var associateId = this.root.getAttribute("data-associate-id");
  var associateEl = associateId ? document.getElementById(associateId) : null;

  this.associate = associateEl;

  return this.associate;
};

ClockComponent.prototype.hasAssociate = function () {
  this.getAssociate();
  return this.associate ? true : false;
};

ClockComponent.prototype.hideAssociate = function (reason) {
  var reason = reason || "not-started";

  if (this.hasAssociate()) {
    this.hide(this.getAssociate());
    dom.addClass(this.getAssociate(), "bn--clock-" + reason);
  }
};

ClockComponent.prototype.hide = function (el) {
  var elToHide = el || this.root;
  dom.display(elToHide, "none");
};

/**
 * utils
 */

ClockComponent.prototype.pad = function (str, size, padding) {
  size = str.length > size ? str.pength : size;
  str = padding.repeat(size) + str;

  return str.substr(str.length - size);
};

export default ClockComponent;
