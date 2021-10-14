"use strict";

import log from "./log";

export default function transport(engine) {
  this.engine = engine;
  this.log = log("transport", this.engine.debug);

  this.account = undefined;
  this.host = undefined;

  this.headers = {
    "Content-Type": "application/json"
  };

  return this;
}

// should be called to set api endpoint to next calls
// account bind to api endpoint here or at engine?
transport.prototype.api = function(api) {
  var base = this.engine.getApiBase(api);

  if (!base) throw new Error("Invalid api endpoint: " + api);

  this.host = base;

  this.log("transport instance api set to " + base);

  return this;
};

transport.prototype.setAccount = function(account) {
  this.account = account;
};

transport.prototype.driver = function() {
  return new XMLHttpRequest();
};

transport.prototype.setHeader = function(name, value) {
  this.headers[name] = value;
  return this;
};

// sync engine headers with transport headers.
// transport headers will take prescedence.
transport.prototype.getEngineHeaders = function(xhr) {
  if (this.engine.getHeaders)
    this.headers = Object.assign({}, this.engine.getHeaders(), this.headers);

  return this.headers;
};

transport.prototype.applyHeaders = function(xhr) {
  this.getEngineHeaders();

  for (var h in this.headers) {
    xhr.setRequestHeader(h, this.headers[h]);
  }

  return this;
};

transport.prototype.validateInstance = function() {
  if (undefined === this.account) {
    throw new Error("account not initialized");
  }

  if (undefined === this.host) {
    throw new Error("api not initialized");
  }
};

transport.prototype.send = function(url, data, cb) {
  var transport = this;
  var burst = Math.floor(Math.random() * new Date().getTime());
  var xhr = this.driver();

  this.validateInstance();

  xhr.open("POST", this.host + url + "?" + burst); // remove/change host

  this.applyHeaders(xhr);

  xhr.send(data);
  xhr.onreadystatechange = function() {
    transport.handleReadyStateChange(xhr, cb);
  };
};

transport.prototype.get = function(url, params, cb) {
  var transport = this;
  var xhr = this.driver();

  this.validateInstance();

  xhr.open("GET", [this.host, url].join("/") + (params ? "?" + params : "")); // remove/change host

  this.applyHeaders(xhr);

  xhr.send();
  xhr.onreadystatechange = function() {
    transport.handleReadyStateChange(xhr, cb);
  };
};

transport.prototype.handleReadyStateChange = function(xhr, cb) {
  if ("function" != typeof cb) {
    // console.log('invalid callback ', cb);
    return;
  }

  // cb when ready only
  if (xhr.readyState === 4) {
    if (xhr.status === 200) {
      // successful
      return cb(null, xhr, xhr.responseText);
    } else if (xhr.status >= 400) {
      // error
      return cb(xhr.status, xhr, null);
    } else {
      // unknown
      return cb(xhr.status, xhr, null);
    }
  }
};
