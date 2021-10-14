// initialize a pivot howcase
var ShowcasePivotComponent = function (element) {
  this.root = element;

  this.init();

  return this;
};

ShowcasePivotComponent.prototype.init = function () {
  this.initializePivotNavigation();
};

/**
 * Initialize pivot navigation method. Allow numeral or button.
 */
ShowcasePivotComponent.prototype.initializePivotNavigation = function () {
  var [, navigationType] =
    /--with-pivot-(numbers|button)/i.exec(this.root.className) || [];

  //   load pivot control from DOM
  this.controls = this.root.querySelectorAll("input[name=beon-pivot-control]");

  if (navigationType === "button") {
    var button = this.root.querySelector(
      ".beon-showcase__pivot-control--button"
    );

    if (!button) {
      return;
    }

    button.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        // event.stopPropagation();

        this.rotatePivot();

        window.clearInterval(this.rotateAnimationInterval);

        button.className += " rotate";
        this.rotateAnimationInterval = window.setInterval(function () {
          button.className = button.className.replace(" rotate", "");
        }, 500);
      }.bind(this)
    );
  }
};

// pivot control
ShowcasePivotComponent.prototype.currentPivot = function () {
  var current = this.root.querySelector(
    "input[name=beon-pivot-control]:checked"
  );

  var currentIndex = current.className.replace("pivot--", "");

  return parseInt(currentIndex, 10);
};

ShowcasePivotComponent.prototype.rotatePivot = function () {
  var current = this.currentPivot();
  var next = this.controls[current + 1] || this.controls[0];

  this.controls.forEach(function (input) {
    input.removeAttribute("checked");
  });

  next.setAttribute("checked", "checked");

  return next;
};

export default ShowcasePivotComponent;
