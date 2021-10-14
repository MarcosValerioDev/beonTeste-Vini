module.exports.treeIdCompose = function (str) {
  return str
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
};
