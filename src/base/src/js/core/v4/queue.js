var queue = function(queue) {
  this.queue = queue || [];
  this.paused = false;
  return this;
};

queue.prototype.push = function() {
  Array.prototype.push.apply(this.queue, arguments);
  return this;
};

queue.prototype.consume = function(callback) {
  if (!this.paused)
    if (this.queue.length)
      do {
        callback(this.queue.shift());
      } while (this.queue.length);

  setTimeout(
    function() {
      this.consume(callback);
    }.bind(this),
    100
  );
};

queue.prototype.pause = function() {
  this.paused = true;
  return this;
};

queue.prototype.pause = function() {
  this.paused = false;
  return this;
};

module.exports = queue;
