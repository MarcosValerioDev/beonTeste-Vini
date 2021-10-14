"use strict";

import engine from "./engine";
import transport from "./transport";
import buddy from "./buddy";

// init engine
var init = function() {
    if ("undefined" == typeof window["beonobject"]) {
        console.log("not loaded properly");
        return;
    }

    window.beone = new engine();
    // beone.env = 'development';

    // beone.getSourceHost = function() {
    //     return 'http://localhost:4000';
    // }
    //
    // beone.getAssetsBase = function() {
    //     return 'http://localhost:5000/23ae4ed5-ad1c-4079-a6c6-601e26444eaa';
    // }

    window.beonb = new buddy(beone);
    // beonb.api.content = 'http://localhost:10001';

    beone.init();
};

init();
