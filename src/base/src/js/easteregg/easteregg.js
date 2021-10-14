var EasterEggComponent = function(root, config) {
  this.root = root;

  this.config = Object.assign(
    {
      prizeStyle: "modal"
    },
    config
  );

  this.init();

  return this;
};

EasterEggComponent.prototype.init = function() {
  this.root.className = this.root.className + " initialized";

  this.updatePrize();
  this.bindTrigger();
  this.bindDismiss();
};

// bindTrigger
EasterEggComponent.prototype.bindTrigger = function() {
  var trigger = this.root.querySelector(".beon-easteregg__trigger-container");

  if (!trigger) {
    throw new Error(`trigger not found`);
  }

  trigger.addEventListener("click", this.handleTrigger.bind(this));
};

// handleTrigger
EasterEggComponent.prototype.handleTrigger = function() {
  if (!this.step) {
    this.changeStep(1);
  } else if (this.step === 1) {
    this.changeStep(0);
  }
};

// bindDismiss
EasterEggComponent.prototype.bindDismiss = function() {
  var trigger = this.root.querySelector(".beon-easteregg__dismiss");

  if (trigger) {
    trigger.addEventListener("click", this.handleDismiss.bind(this));
  }
};

// handleDismiss
EasterEggComponent.prototype.handleDismiss = function() {
  this.changeStep(0);
};

// updatePrize
EasterEggComponent.prototype.updatePrize = function() {
  var prize = this.root.querySelector(".beon-easteregg__prize");

  if (this.config.prizeStyle) {
    prize.className += " beon-easteregg__prize--" + this.config.prizeStyle;
  }

  // initialize prize as hidden
  this.hidePrize();
};

// showPrize
EasterEggComponent.prototype.showPrize = function() {
  // hide already opened
  this.hidePrize();

  var prize = this.root.querySelector(".beon-easteregg__prize");
  prize.className += " opened";
};

// hidePrize
EasterEggComponent.prototype.hidePrize = function() {
  var prize = this.root.querySelector(".beon-easteregg__prize");

  if (!prize) {
    throw new Error(`prize not found`);
  }

  prize.className = prize.className.replace(/( opened)/gi, "");
};

// change component step
EasterEggComponent.prototype.changeStep = function(toStep) {
  if (toStep === 0) {
    this.hidePrize();
  } else if (toStep === 1) {
    this.showPrize();
  }

  this.step = toStep;
};

export default EasterEggComponent;
