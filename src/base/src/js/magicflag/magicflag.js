var MagicFlagComponent = function (root, config) {
  this.root = root;

  if (window.beonevents && window.beonevents[config.id]) {
    return;
  }

  const [
    id,
    type,
    variant,
    position,
    className,
    innerHTML,
    sealSrc,
    style,
    itemQuery,
    containerQuery,
    placementOperation,
    itemsIds,
  ] = config;

  this.config = Object.assign(
    {
      id: undefined,
      type: "flag",
      variant: "seal",
      position: "45deg",
      className: undefined,
      innerHTML: undefined,
      sealSrc: undefined,
      style: undefined,
      itemQuery: undefined,
      containerQuery: "self",
      placementOperation: "append",
      itemsIds: [],
    },
    {
      id,
      type,
      variant,
      position,
      className,
      innerHTML,
      sealSrc,
      style,
      itemQuery,
      containerQuery,
      placementOperation,
      itemsIds,
    }
  );

  this.init();

  return this;
};

MagicFlagComponent.prototype.init = function () {
  this.root.className = this.root.className + " initialized";

  // add tags
  this.add(this.config).then((res) => {
    if (window.beonevents && window.beonevents[this.config.id]) {
      return;
    }

    window.beonevents = window.beonevents || {};
    window.beonevents[this.config.id] = true;
  });

  var debounce;

  // reaply on every injection from now on
  document.addEventListener("beon.buddy.slider.init.after", (event) => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      console.log(`flags add after slider initialize`);
      this.add(this.config, document);
    }, 500);
  });

  // support hash changes
  window.addEventListener("hashchange", (event) => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      console.log(`flags add after window change`);
      this.add(this.config, document);
    }, 1000);
  });
};

MagicFlagComponent.prototype.add = function (options, container) {
  return new Promise(
    function (resolve) {
      // console.log(options, container);
      let contentTemplate;
      container = container || document;

      if (options.variant === "bullet") {
        contentTemplate = options.innerHTML;
      }

      var promisesArray = [];

      for (var i = 0; i < options.itemsIds.length; i++) {
        promisesArray.push(
          new Promise((resolve) => {
            var itemDefinition = options.itemsIds[i];
            let itemId, args;

            if (Array.isArray(itemDefinition)) {
              [itemId, ...args] = itemDefinition;
            } else {
              itemId = itemDefinition;
            }

            var elementsSelector = options.itemQuery.replace(/{id}/gi, itemId);
            var elements = container.querySelectorAll(elementsSelector);

            // console.log(elementsSelector, elements);

            if (!elements.length) {
              resolve();
              return;
            }

            if (options.type === "dynamic") {
              const [itemInnerHtml, itemClassName] = args;
              if (itemInnerHtml) {
                options.innerHTML = contentTemplate
                  ? contentTemplate.replace(
                      "{x}",
                      ` <span class="dynamic_info">${itemInnerHtml}</span> `
                    )
                  : itemInnerHtml;
              }

              options.className += itemClassName || "";
            }

            if (elements.length) {
              elements.forEach((element) => {
                var parent =
                  options.containerQuery === "self"
                    ? element
                    : element.querySelector(options.containerQuery);

                if (!parent) parent = element;

                this.append(parent, options);
              });
            }

            resolve();
          })
        );
      }

      Promise.all(promisesArray).then((res) => resolve(res));
    }.bind(this)
  );
};

MagicFlagComponent.prototype.append = function (parent, options) {
  // do not duplicate tags
  var duplicate = parent.querySelector(".beon-tags.beon-tag__" + options.id);

  if (duplicate) {
    return;
  }

  var bullet = document.createElement("div");

  var classes = [
    "beon-tags",
    "beon-tag__" + options.id,
    "beon-tag__" + options.position,
    "beon-tag__" + options.type,
    "beon-tag__" + options.type + "--" + options.variant,
    options.className,
  ];

  var style = options.style;

  if (options.sealSrc)
    style += "background-image: url(" + options.sealSrc + ");";

  bullet.className = classes.join(" ");
  bullet.setAttribute("style", style);
  bullet.innerHTML = options.innerHTML;

  if (options.placementOperation === "replace") {
    parent.innerHTML = "";
  }

  parent.appendChild(bullet);

  // relativize parent position to support floating tags
  // var parentStyles = getComputedStyle(parent);
  // var parentPosition = parentStyles.position;

  // if (!parentPosition || parentPosition === "static") {
  //   parent.style.position = "relative";
  // }
};

export default MagicFlagComponent;
