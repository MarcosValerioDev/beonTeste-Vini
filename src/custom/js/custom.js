"use strict";

import BeonCustom from "../../base/src/js/core/custom/custom";
import VtexParser from "../../base/src/js/core/v4/track/parser/vtex";
import VtexPlugin from "../../base/src/js/core/v4/track/plugin/vtex";
import MagicflagInitializer from "../../base/src/js/magicflag/init";
import ClockInitializer from "../../base/src/js/clock/init";
import NotificationInitializer from "../../base/src/js/notification/init";

var treeIdCompose = (str) =>
  str
    .toLowerCase()
    .replace(/\s/gi, "_")
    .replace(/([\xE0-\xFF])/gi, (input) => {
      const charlist = [
        [/[\xE0-\xE6]/g, "a"],
        [/[\xE8-\xEB]/g, "e"],
        [/[\xEC-\xEF]/g, "i"],
        [/[\xF2-\xF6]/g, "o"],
        [/[\xF9-\xFC]/g, "u"],
        [/\xE7/g, "c"],
        [/\xF1/g, "n"],
      ];
      const found = charlist.find((m) => m[0].test(input));
      return found ? found[1] : input;
    })
    .replace(/\W/gi, "");

var CustomInstance = function () {
  new VtexPlugin();

  BeonCustom.call(this);

  return this;
};

CustomInstance.prototype = Object.create(BeonCustom.prototype);
CustomInstance.prototype.constructor = CustomInstance;

CustomInstance.prototype.initParser = function () {
  BeonCustom.prototype.initParser.call(this, new VtexParser());

  this.parser.parseProduct = function () {
    var product = {
      pathname: undefined,
    };

    try {
      // buscar pathname na canonical
      var source = document.querySelector("link[rel=canonical]");

      if (!source) {
        return {};
      }

      var canonical = source.getAttribute("href");
      var path = canonical.replace(window.location.origin, "");

      product.pathname = path;
    } catch (e) {
      console.warn(`product parse failed with ${e.message}`);
    }

    return product;
  };

  // this.parser.parseCatalog = function () {
  //   var trees = [];

  //   try {
  //     var bodyClasses = document.body.className;
  //     var pathname = window.location.pathname;

  //     if (/marca/i.test(bodyClasses)) {
  //       if (pathname === "experiencia-dark") {
  //         trees.push({
  //           kind: "department",
  //           tree_id: "experiencia_dark",
  //         });
  //       } else {
  //         trees.push({
  //           kind: "brand",
  //           tree_id: pathname.replace("/", ""),
  //         });

  //         trees.push({
  //           kind: "department",
  //           tree_id: "livros",
  //         });
  //       }
  //     } else if (/(resultado-busca|categoria)/i.test(bodyClasses)) {
  //       trees.push({
  //         kind: "department",
  //         tree_id: "livros",
  //       });
  //     }
  //   } catch (e) {
  //     console.warn(`catalog parse failed with ${e.message}`);
  //   }

  //   return { trees: trees };
  // };

  return this.parser;
};

CustomInstance.prototype.initCustomTriggers = function () {
  BeonCustom.prototype.initCustomTriggers.call(this);

  new MagicflagInitializer();
  new ClockInitializer();
  new NotificationInitializer();

  return this;
};

window.beon_custom = new CustomInstance();
window.beon_custom.init();
