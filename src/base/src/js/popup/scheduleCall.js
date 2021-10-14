"use strict";

export default function ScheduleCall(parent, root) {
  this.data = {};
  this.parent = parent;
  this.root = jQuery(root);

  this.endpoint = "https://b.usebeon.io/flex";

  return this.init();
}

ScheduleCall.prototype.init = function() {
  var me = this;

  this.parent.feedback(null);

  this.root.find("#call-submit").on("click", function(event) {
    event.preventDefault();
    event.stopPropagation();

    me.submit();
  });

  this.root.on("method:toggle", function(event, method) {
    if (method == "#popup-call") {
      me.reset();
    }
  });

  return this;
};

ScheduleCall.prototype.reset = function() {
  this.parent.feedback(null);
  this.root.find("#call-form input").val("");

  // reset data
  this.data = {};
};

ScheduleCall.prototype.submit = function() {
  var me = this;

  if (this.populate())
    if (this.validate()) {
      this.loading("start");

      // beon update
      if (typeof beon !== "undefined") {
        // beon("send", "event", {
        //   type: "interaction",
        //   id: "protoype",
        //   action: "schedule_call"
        // });

        beon("send", "event", {
          type: "customer",
          payload: this.data
        });
      }

      window.setTimeout(function() {
        me.post(
          function(data) {
            me.loading("done");
            me.success(data);
          },
          function(data) {
            me.loading("done");
            me.fail("call");
          }
        );
      }, 1000);
    } else {
      this.fail("data");
    }
};

ScheduleCall.prototype.populate = function() {
  var data = {};

  var telefone = this.root
    .find("#call-telefone")
    .val()
    .replace("/[D]/", "");
  telefone = telefone.replace(/^\d*0?([0-9]{11})$/, "$1");
  telefone = telefone.replace(/^0?([0-9]+)$/, "$1");

  data.id = this.parent.cookie("beon-session-id");
  data.nome = this.root.find("#call-nome").val();
  data.telefone = "55" + telefone;
  data.email = this.root.find("#call-email").val();

  this.data = data;

  return data;
};

ScheduleCall.prototype.validate = function() {
  if (this.data === {}) {
    return false;
  }

  if (
    !/^[\w\s]+$/i.test(this.data.nome) ||
    !/^\d{13,}$/i.test(this.data.telefone) ||
    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(this.data.email)
  ) {
    console.log("callback data validation fail");
    return false;
  }

  return true;
};

ScheduleCall.prototype.post = function(success, fail) {
  var settings = {
    async: true,
    crossDomain: true,
    url: this.endpoint,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Accept-Encoding": "gzip, deflate",
      "Content-Length": "131",
      Connection: "keep-alive",
      "cache-control": "no-cache"
    },
    processData: false,
    data: JSON.stringify(this.data)
  };

  $.ajax(settings)
    .done(function(response) {
      console.log(response);
      if (response.statusCode === "200") {
        return success();
      }

      return fail();
    })
    .error(fail);
};

ScheduleCall.prototype.loading = function(state) {
  var button = this.root.find("#call-submit");

  if (state == "start") {
    button.attr("disabled", "disabled");
    button.data("label", button.text());
    button.text("Conectando a um atendente...");
    button.addClass("loading");
  } else {
    button.removeAttr("disabled");
    button.text(button.data("label"));
    button.removeClass("loading");
  }
};

ScheduleCall.prototype.fail = function(reason) {
  this.parent.feedback("error-" + reason);
};

ScheduleCall.prototype.success = function() {
  var me = this;

  this.root.find(".methods-container").hide();
  this.parent.feedback("success");
  this.parent.scroll(this.root);
};
