var pipeline = require('./pipeline.js');

module.exports = (function() {
  var Endpoint = function(chain) {
    var chainPipeline = pipeline(chain);

    this.execute = function(bundle) {
      return chainPipeline(bundle);
    };
  };

  return Endpoint;
}());
