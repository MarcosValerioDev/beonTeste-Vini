"use strict";

var lory = require("lory.js").lory;
var slider = function(element) {
    this.root = element;

    this.config = {
        setup: {
            classNameFrame: "beon-slider__frame",
            classNameSlideContainer: "beon-slider__slides",
            classNamePrevCtrl: "beon-slider__prev",
            classNameNextCtrl: "beon-slider__next",
            slideSpeed: 1000,
            slidesToScroll: 1,
            infinite: 0,
            enableMouseEvents: true,
            visible: 1
        },

        options: {
            classNameDotsContainer: "beon-slider__dots",
            dots: 0,
            viewportContainer: document.body
        },

        currentViewport: {},

        viewports: [
            [
                768,
                {
                    visible: 4,
                    slidesToScroll: 1,
                    enableMouseEvents: true
                }
            ],
            [
                375,
                {
                    visible: 2,
                    slidesToScroll: 1,
                    enableMouseEvents: true
                }
            ],
            [
                0,
                {
                    visible: 1,
                    slidesToScroll: 1,
                    enableMouseEvents: true
                }
            ]
        ]
    };

    this.init();

    return this;
};

module.exports = slider;

slider.prototype.init = function() {
    this.getConfigFromElement();
    this.getCurrentViewport();
    this.applySlider();
};

slider.prototype.getConfigFromElement = function() {
    var data, elementConfig;

    data = this.root.getAttribute("data-config");

    // {viewports: {"0": {i:1,s:1}, "600":{i:2,s:2}}]}

    if (!data) {
        data = "{}";
    }

    try {
        elementConfig = JSON.parse(data);

        if (elementConfig.viewports) {
            var viewports = [];

            for (var i in elementConfig.viewports) {
                viewports.push([
                    i,
                    {
                        visible: elementConfig.viewports[i].i || 1,
                        slidesToScroll: elementConfig.viewports[i].s || 1,
                        spaceBetween: elementConfig.viewports[i].b || null
                    }
                ]);
            }

            viewports.sort(function(a, b) {
                return b[0] - a[0];
            });

            this.config.viewports = viewports;
        }

        this.config.options.dots =
            elementConfig.dots || this.config.options.dots;
    } catch (e) {
        console.log(e);
    }

    return this.config;
};

slider.prototype.getCurrentViewport = function() {
    if (!this.config.viewports) {
        return this.config;
    }

    var referenceWidth = window.innerWidth;
    var config = {};

    for (var i in this.config.viewports) {
        var viewport = this.config.viewports[i];

        if (!(viewport[0] <= referenceWidth)) {
            continue;
        }

        config = this.extendObject(config, viewport[1]);

        config.viewport = viewport[0];

        break;
    }

    this.config.currentViewport = config;

    return this.config.currentViewport;
};

slider.prototype.applySlider = function() {
    this.resizeSlider();

    this.root.addEventListener("on.lory.resize", this.handleResize.bind(this));
    this.root.className = this.root.className + " initialized";

    if (this.config.options.dots) this.applyDots();

    var setup = this.extendObject(
        this.config.setup,
        this.config.currentViewport || {}
    );
    this.slider = lory(this.root, setup);

    return this;
};

slider.prototype.resizeSlider = function() {
    this.getCurrentViewport();
    this.applyItemsWidth();

    if (this.slider) {
        // apply setup
        var setup = this.extendObject(
            this.config.setup,
            this.config.currentViewport || {}
        );

        this.slider.setup(setup);
    }

    return this;
};

slider.prototype.handleResize = function() {
    this.resizeSlider();
};

slider.prototype.applyItemsWidth = function() {
    if (!this.config.currentViewport) {
        return this;
    }

    var element = this.root.querySelector(
        "." + this.config.setup.classNameFrame
    );
    var elementStyle = window.getComputedStyle(element, null);

    var referenceWidth = parseInt(elementStyle.getPropertyValue("width"), 10);
    referenceWidth -= parseInt(
        elementStyle.getPropertyValue("padding-left"),
        10
    );
    referenceWidth -= parseInt(
        elementStyle.getPropertyValue("padding-right"),
        10
    );

    var itemWidth = Math.floor(
        referenceWidth / this.config.currentViewport.visible
    );
    var items = this.root.querySelectorAll(".beon-slider__slide");

    if (items.length)
        items.forEach(function(item) {
            item.style.width = itemWidth + "px";
        });

    return this;
};

/**
 * dots
 */

slider.prototype.applyDots = function() {
    this.root.addEventListener(
        "before.lory.init",
        this.handleDotsEvents.bind(this)
    );
    this.root.addEventListener(
        "after.lory.init",
        this.handleDotsEvents.bind(this)
    );
    this.root.addEventListener(
        "after.lory.slide",
        this.handleDotsEvents.bind(this)
    );
};

slider.prototype.initializeSliderDots = function() {
    this.config.options.slidesCount = this.root.querySelectorAll(
        ".beon-slider__slide"
    ).length;

    this.config.options.dotsCount = Math.ceil(
        this.config.options.slidesCount /
            this.config.currentViewport.slidesToScroll
    );

    this.config.options.dotsContainer = this.root.querySelector(
        "." + this.config.options.classNameDotsContainer
    );
};

slider.prototype.handleDotsEvents = function(event) {
    if (event.type === "before.lory.init") {
        this.initializeSliderDots();
        this.createDots();
    }

    if (event.type === "after.lory.init") {
        this.bindDotsEvents();
    }

    if (event.type === "after.lory.slide") {
        this.hitDot();
    }
};

slider.prototype.createDots = function() {
    var dotsCount = this.config.options.dotsCount;
    var dotsContainer = this.config.options.dotsContainer;

    dotsContainer.innerText = "";

    var dotTemplate = document.createElement("span");
    dotTemplate.classList.add("dot");

    for (var i = 0, len = dotsCount; i < len; i++) {
        var clone = dotTemplate.cloneNode();
        clone.innerText = i + 1;
        dotsContainer.appendChild(clone);
    }

    dotsContainer.childNodes[0].classList.add("active");
};

slider.prototype.bindDotsEvents = function() {
    var slidesCount = this.config.options.slidesCount;
    var dotsCount = this.config.options.dotsCount;
    var dotsContainer = this.config.options.dotsContainer;

    for (var i = 0, len = dotsCount; i < len; i++) {
        dotsContainer.childNodes[i].addEventListener(
            "click",
            function(event) {
                var target = Array.prototype.indexOf.call(
                    dotsContainer.childNodes,
                    event.target
                );

                var slideToScroll =
                    target * this.config.currentViewport.slidesToScroll;

                if (slideToScroll > slidesCount) slideToScroll = slidesCount;

                this.slider.slideTo(slideToScroll);
            }.bind(this)
        );
    }
};

slider.prototype.hitDot = function() {
    var dotsContainer = this.config.options.dotsContainer;

    for (var i = 0, len = dotsContainer.childNodes.length; i < len; i++) {
        dotsContainer.childNodes[i].classList.remove("active");
    }

    var current =
        this.slider.returnIndex() / this.config.currentViewport.slidesToScroll;

    dotsContainer.childNodes[current].classList.add("active");
};

// utils
slider.prototype.extendObject = function(o1, o2) {
    if (window.Object) {
        return Object.assign(o1, o2);
    }

    for (var key in o1) {
        if (o2.hasOwnProperty(key)) o1[key] = o2[key];
    }

    return o1;
};
