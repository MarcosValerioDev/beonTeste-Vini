"use strict";

export default function transport(engine) {
  this.engine = engine;

  this.account = null;
  this.host = this.engine.getSourceHost("protocolwithports");

  this.headers = {
    "Content-Type": "application/json"
  };

  return this;
}

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

transport.prototype.send = function(url, data, cb) {
  var transport = this;
  var burst = Math.floor(Math.random() * new Date().getTime());
  var xhr = this.driver();

  if (null == this.account) {
    throw new Error("account not initialized");
  }

  xhr.open("POST", this.host + "/" + this.account + url + "?" + burst); // remove/change host

  this.applyHeaders(xhr);

  xhr.send(data);
  xhr.onreadystatechange = function() {
    transport.handleReadyStateChange(xhr, cb);
  };
};

transport.prototype.get = function(url, params, cb) {
  var transport = this;
  var xhr = this.driver();

  if (null == this.account) {
    throw new Error("account not initialized");
  }

  xhr.open(
    "GET",
    [this.host, this.account, url].join("/") + (params ? "?" + params : "")
  ); // remove/change host

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
