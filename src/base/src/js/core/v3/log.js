"use strict";

export default function(logger, debug) {
    var logger = logger || "beon";

    return function() {
        if (!debug) {
            return;
        }

        Array.prototype.slice.call(arguments).forEach(function(log) {
            if (typeof log == "object") {
                console.log(logger + ": object");
                console.log(log);
            } else {
                console.log(logger + ": " + log);
            }
        });
    };
}
