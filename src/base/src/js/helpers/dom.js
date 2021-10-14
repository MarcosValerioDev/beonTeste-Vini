const hasClass = function (el, className) {
  var regex = new RegExp(className + "\b", "im");
  return regex.test(el.className);
};

const addClass = function (el, classList) {
  var classes = classList.split(",");
  var className = el.className;

  for (var i = 0; i < classes.length; i++) {
    var current = classes[i];
    className =
      className.indexOf(current) < 0 ? className + " " + current : className;
  }

  el.className = className;
};

const removeClass = function (el, classList) {
  var classes = classList.split(",");
  var className = el.className;

  for (var i = 0; i < classes.length; i++) {
    var current = new RegExp(classes[i], "im");
    className = className.replace(current, "");
  }

  el.className = className;
};

const display = function (el, value) {
  removeClass(el, "bn--block, bn--flex, bn--grid, bn--hide, bn--none");
  addClass(el, "bn--" + value);
};

module.exports = { hasClass, addClass, removeClass, display };
