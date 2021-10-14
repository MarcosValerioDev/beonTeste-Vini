"use strict";

import log from "./log";
import engine from "./engine";

// init engine
var init = function() {
  var debug = window._beonlog || false;
  var _log = log("loader", debug);

  if ("undefined" == typeof window["beonobject"]) {
    _log("beon object not loaded properly");
    return;
  }

  window.beone = new engine();
  window.beone.debug = debug;
  window.beone.env = "development";
  window.beone.init();
};

init();
