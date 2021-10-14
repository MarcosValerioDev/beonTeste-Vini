// server.js
// beon-pusher test server

// external dependencies
var express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var morgan = require("morgan");

// app init
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan("dev"));

// routers
app.get("/teste/:component", function (req, res) {
  res.sendFile(`${__dirname}/src/static/${req.params.component}.html`);
});

app.get("/tool/:key/:component", function (req, res) {
  res.sendFile(
    `${__dirname}/src/tools/${req.params.key}/${req.params.component}.html`
  );
});

app.use("/assets", express.static(`${__dirname}/dist`));

app.all("*", function (req, res) {
  res.send(req.params);
});

// server
app.listen(5000);
