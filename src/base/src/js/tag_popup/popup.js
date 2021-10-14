const beon_poporver_check = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgNTIgNTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUyIDUyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiPjxnPjxnPgoJPHBhdGggZD0iTTI2LDBDMTEuNjY0LDAsMCwxMS42NjMsMCwyNnMxMS42NjQsMjYsMjYsMjZzMjYtMTEuNjYzLDI2LTI2UzQwLjMzNiwwLDI2LDB6IE0yNiw1MEMxMi43NjcsNTAsMiwzOS4yMzMsMiwyNiAgIFMxMi43NjcsMiwyNiwyczI0LDEwLjc2NywyNCwyNFMzOS4yMzMsNTAsMjYsNTB6IiBkYXRhLW9yaWdpbmFsPSIjMDAwMDAwIiBjbGFzcz0iYWN0aXZlLXBhdGgiIHN0eWxlPSJmaWxsOiNGRkZGRkYiIGRhdGEtb2xkX2NvbG9yPSIjMDAwMDAwIj48L3BhdGg+Cgk8cGF0aCBkPSJNMzguMjUyLDE1LjMzNmwtMTUuMzY5LDE3LjI5bC05LjI1OS03LjQwN2MtMC40My0wLjM0NS0xLjA2MS0wLjI3NC0xLjQwNSwwLjE1NmMtMC4zNDUsMC40MzItMC4yNzUsMS4wNjEsMC4xNTYsMS40MDYgICBsMTAsOEMyMi41NTksMzQuOTI4LDIyLjc4LDM1LDIzLDM1YzAuMjc2LDAsMC41NTEtMC4xMTQsMC43NDgtMC4zMzZsMTYtMThjMC4zNjctMC40MTIsMC4zMy0xLjA0NS0wLjA4My0xLjQxMSAgIEMzOS4yNTEsMTQuODg1LDM4LjYyLDE0LjkyMiwzOC4yNTIsMTUuMzM2eiIgZGF0YS1vcmlnaW5hbD0iIzAwMDAwMCIgY2xhc3M9ImFjdGl2ZS1wYXRoIiBzdHlsZT0iZmlsbDojRkZGRkZGIiBkYXRhLW9sZF9jb2xvcj0iIzAwMDAwMCI+PC9wYXRoPgo8L2c+PC9nPiA8L3N2Zz4=`;

import uuid from "uuid";

var TagPopupComponent = function(root, config) {
  this.root = root;

  this.config = Object.assign(
    {
      id: null,
      // if, after submiting, the popup keeps itself on page allowing user to change his options
      allowChange: true,
      // if, after submiting, the content for current page should be reloaded.
      reloadContent: true,
      // state 0: button, state 1: popup
      initialState: 0,
      messages: {
        title: "Encontre ofertas exclusivas!",
        loading: "Carregando ofertas personalizadas…",
        success: "Pronto! Aproveite uma experiência única.",
        error: "Ops, não conseguimos atualizar suas preferências.",
        triggerLabel: "Encontre ofertas exclusivas",
        invalidInput: "Selecione as opções para entendermos suas preferências!",
        invalidOption: "Não reconheccemos essa opção."
      },
      options: [
        // {
        //   tree: "veiculo",
        //   order: 1,
        //   label: "Digite o modelo do seu veículo:",
        //   options: [
        //     ["veiculo:uno", "Uno"],
        //     ["veiculo:palio", "Palio"],
        //     ["veiculo:xsara", "Xsara"]
        //   ]
        // }
      ]
    },
    config
  );

  this.init();

  return this;
};

TagPopupComponent.prototype.init = function() {
  this.root.className = this.root.className + " initialized";
  this.render();
  this.initialState();
};

TagPopupComponent.prototype.initialState = function() {
  const control = this.getControlCookie();

  if (control === "done") {
    if (this.config.allowChange) {
      this.changeStep(0);
    } else {
      this.hideComponent();
    }

    return;
  }

  this.changeState(this.config.initialState);
};

TagPopupComponent.prototype.render = function() {
  // build wrappers
  const beon_popover = document.createElement("div");
  beon_popover.className = "beon_popover";

  const wrap_popover = document.createElement("div");
  wrap_popover.className = "wrap_popover";
  wrap_popover.id = "beon_wrap_popover";

  //   trigger step
  const step0 = document.createElement("div");
  step0.className = "beon_popover_step beon_popover_step--0";

  step0.appendChild(this.buildTitleTrigger());

  wrap_popover.appendChild(step0);

  //   form step
  const step1 = document.createElement("div");
  step1.className = "beon_popover_step beon_popover_step--1";

  step1.appendChild(this.buildHead());

  this.config.options
    .sort((a, b) => a.order - b.order)
    .forEach(option => step1.appendChild(this.buildOption(option)));

  step1.appendChild(this.buildFormControls());
  step1.appendChild(this.buildPopupControls());

  wrap_popover.appendChild(step1);

  //   loading stepconst step2 = document.createElement("div");
  const step2 = document.createElement("div");
  step2.className = "beon_popover_step beon_popover_step--2";

  this.buildLoadingFeedback().forEach(element => step2.appendChild(element));

  wrap_popover.appendChild(step2);

  // feedback step
  const step3 = document.createElement("div");
  step3.className = "beon_popover_step beon_popover_step--3";

  step3.appendChild(this.buildSuccessFeedback());
  step3.appendChild(this.buildErrorFeedback());

  wrap_popover.appendChild(step3);

  beon_popover.appendChild(wrap_popover);
  beon_popover.appendChild(this.buildBulletTrigger());

  this.root.appendChild(beon_popover);
  this.changeStep(0);
};

TagPopupComponent.prototype.buildTitleTrigger = function() {
  const div0 = document.createElement("div");
  div0.id = "beon_popover_step_0";
  div0.style.display = "flex";
  div0.style.flexDirection = "column";
  div0.style.margin = "auto";
  div0.style.cursor = "pointer";
  div0.addEventListener("click", () => this.changeStep(1));

  const popover_icon = document.createElement("div");
  popover_icon.id = "beon_popover_icon";
  popover_icon.className = "popover_icon popover_icon--up";

  div0.appendChild(this.buildHead());
  div0.appendChild(popover_icon);

  return div0;
};

TagPopupComponent.prototype.buildBulletTrigger = function() {
  const beon_popover_button = document.createElement("div");
  beon_popover_button.className = "bubble_button animated fadeIn";

  beon_popover_button.innerHTML =
    "<span class='bubble_button__icon'></span><span class='bubble_button__label'>" +
    this.config.messages.triggerLabel +
    "</span>";

  beon_popover_button.addEventListener("click", () => {
    const popover = this.root.querySelector("#beon_wrap_popover");

    if ("flex" === popover.style.display) {
      this.changeStep(0);
    } else {
      this.changeStep(1);
    }
  });

  return beon_popover_button;
};

TagPopupComponent.prototype.buildHead = function() {
  const text0 = document.createElement("span");
  text0.className = "beon_popover-head";
  text0.innerText = this.config.messages.title;

  return text0;
};

TagPopupComponent.prototype.buildOption = function(option) {
  const divSelect = document.createElement("div");
  divSelect.style.display = "flex";
  divSelect.style.flexDirection = "column";

  const wrap_select = document.createElement("div");
  wrap_select.className = "wrap_select";

  const input = document.createElement("input");
  input.placeholder = option.label;
  input.className = "popover_select";
  input.name = option.tree;
  input.setAttribute("list", `${option.tree}_list`);

  input.addEventListener(
    "change",
    function(event) {
      const { target } = event;
      const label = target.value;
      const id = target.getAttribute("list");
      const textRegexp = new RegExp(`${label}`, "i");

      const datalistOptions = document.querySelectorAll(`#${id} option`);

      let selected;
      for (let i = 0, c = datalistOptions.length; i < c; i++) {
        const option = datalistOptions[i];
        const label = option.value;

        if (textRegexp.test(label)) {
          selected = option.getAttribute(`data-option`);
          break;
        }
      }

      if (selected) {
        target.setAttribute(`data-selected`, selected);
      } else {
        this.reportError(this.config.messages.invalidOption);
      }
    }.bind(this)
  );

  const datalist = document.createElement("datalist");
  datalist.id = input.getAttribute("list");

  for (const opt of option.options) {
    const optionEl = document.createElement("option");
    optionEl.value = opt[1];
    optionEl.setAttribute(`data-option`, opt);

    datalist.appendChild(optionEl);
  }

  wrap_select.appendChild(input);
  wrap_select.appendChild(datalist);

  return wrap_select;
};

TagPopupComponent.prototype.buildFormControls = function() {
  const buttonOk = document.createElement("button");
  buttonOk.className = "popover_search_button";
  buttonOk.innerText = "OK";
  buttonOk.addEventListener("click", this.handleSubmit.bind(this));

  return buttonOk;
};

TagPopupComponent.prototype.buildPopupControls = function() {
  const buttonFechar = document.createElement("button");
  buttonFechar.className = "popover_close_button";
  buttonFechar.innerText = "FECHAR";
  buttonFechar.addEventListener("click", () => this.changeStep(0));

  return buttonFechar;
};

TagPopupComponent.prototype.buildLoadingFeedback = function() {
  const loadingGif = document.createElement("div");
  loadingGif.className = "lds-roller";
  loadingGif.innerHTML =
    "<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>";

  const textLoading = document.createElement("span");
  textLoading.className = "animated fadeIn";
  textLoading.style.margin = "0px auto 20px auto";
  textLoading.innerText = this.config.messages.loading;

  return [loadingGif, textLoading];
};

TagPopupComponent.prototype.buildSuccessFeedback = function() {
  const feedback = document.createElement("div");
  feedback.className = "on--success";

  const imageCheck = document.createElement("img");
  imageCheck.className = "animated tada";
  imageCheck.style.height = "64px";
  imageCheck.style.margin = "20px auto";
  imageCheck.src = beon_poporver_check;

  const textPronto = document.createElement("span");
  textPronto.className = "animated fadeIn";
  textPronto.style.margin = " 0px auto 20px auto";
  textPronto.innerText = this.config.messages.success;

  feedback.appendChild(imageCheck);
  feedback.appendChild(textPronto);

  return feedback;
};

TagPopupComponent.prototype.buildErrorFeedback = function() {
  const feedback = document.createElement("div");
  feedback.className = "on--error";

  const imageCheck = document.createElement("img");
  imageCheck.className = "animated tada";
  imageCheck.style.height = "64px";
  imageCheck.style.margin = "20px auto";
  imageCheck.src = beon_poporver_check;

  const textPronto = document.createElement("span");
  textPronto.className = "animated fadeIn";
  textPronto.style.margin = " 0px auto 20px auto";
  textPronto.innerText = this.config.messages.error;

  feedback.appendChild(imageCheck);
  feedback.appendChild(textPronto);

  return feedback;
};

TagPopupComponent.prototype.changeStep = function(step) {
  const popover = this.root.querySelector("#beon_wrap_popover");

  if (step === 0) {
    this.reset();
  }

  if (step === 3) {
    popover.className = "wrap_popover animated slideOutDown";
  } else {
    this.root.querySelector("#beon_wrap_popover").className = "wrap_popover";
  }

  this.root.querySelector(".beon_popover_step--0").style.display = "none";
  this.root.querySelector(".beon_popover_step--1").style.display = "none";
  this.root.querySelector(".beon_popover_step--2").style.display = "none";
  this.root.querySelector(".beon_popover_step--3").style.display = "none";
  this.root.querySelector(`.beon_popover_step--${step}`).style.display = "flex";

  popover.className = popover.className.replace(/(step--[0-9])/i, "");
  popover.className = popover.className + " step--" + step;
};

TagPopupComponent.prototype.hideComponent = function() {
  this.root.style.display = "none";
};

TagPopupComponent.prototype.changeState = function(state) {
  let className = this.root.querySelector("#beon_wrap_popover").className;
  className = className.replace(/(state--.+?)/i, "");

  if (state) className += ` state--${state}`;

  this.root.querySelector("#beon_wrap_popover").className = className;
};

TagPopupComponent.prototype.handleSubmit = function() {
  let values = [];

  this.root
    .querySelectorAll("input[list]")
    .forEach(select =>
      values.push(select.getAttribute("data-selected").split(",")[0])
    );

  values = values.filter(value => value.length);

  if (!values.length) {
    this.reportError(this.config.messages.invalidInput);
    return;
  }

  this.changeStep(2);

  // get parser info
  let currentPage = "homepage";
  let parsed = {};

  if (window.beon_custom) {
    currentPage = window.beon_custom.currentPage();
    parsed = window.beon_custom.parser.parse(currentPage);
  }

  const ackEvent = {
    event_id: uuid.v4(),
    timestamp: Date.now(),
    type: "ack",
    payload: Object.assign(
      {
        payloadType: "user_tags",
        pageType: currentPage,
        tags: []
      },
      parsed
    )
  };

  values.forEach(value =>
    ackEvent.payload.tags.push({ type: "tree", label: value })
  );

  if (window.beon) {
    document.addEventListener(
      "beon.engine.send.response",
      function(event) {
        var what = event.detail.what;
        var payload = event.detail.payload;

        // run after pageview event
        if (what === "event" && payload.event_id === ackEvent.event_id)
          this.handleResponse(event);
      }.bind(this)
    );

    beon("send", "event", ackEvent);
  } else {
    setTimeout(() => this.handleResponse(true), 2000);
  }
};

TagPopupComponent.prototype.handleResponse = function(event) {
  this.changeStep(3);

  if (event) this.changeState("success");
  else this.changeState("error");

  this.setControlCookie();

  window.setTimeout(() => this.changeStep(0), 6000);
};

TagPopupComponent.prototype.reset = function() {
  // reset selects
  this.root
    .querySelectorAll("input[list]")
    .forEach(select => (select.value = ""));

  //   reset wrapper classes
  this.root.querySelector("#beon_wrap_popover").className = "wrap_popover";
  this.changeState(null);
};

TagPopupComponent.prototype.reportError = function(message) {
  const button = this.root.querySelector(".popover_search_button");
  button.innerText = message;

  button.className = button.className + " has-error";
  setTimeout(() => {
    button.innerText = "OK";
    button.className = button.className.replace(" has-error", "");
  }, 3000);
};

TagPopupComponent.prototype.setControlCookie = function() {
  const cookieName = `beon-control-${this.config.id}`;

  var cookie = "",
    expires = "",
    path = "/",
    domain = window.location.hostname,
    value = "done";

  cookie =
    cookieName +
    "=" +
    value +
    expires +
    "; domain=" +
    domain +
    "; path=" +
    path;

  document.cookie = cookie;

  return value;
};

TagPopupComponent.prototype.getControlCookie = function() {
  const cookieName = `beon-control-${this.config.id}`;

  var cookies = document.cookie.split(";");
  var value = null;

  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];

    while (cookie.charAt(0) == " ") cookie = cookie.substring(1, cookie.length);

    if (cookie.indexOf(cookieName) === 0) {
      value = cookie.substring(cookieName.length + 1, cookie.length);
      break;
    }
  }

  return value;
};

export default TagPopupComponent;
