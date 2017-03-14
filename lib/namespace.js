var Bundle = require('@markonis/bundle');

module.exports = (function() {
  var Namespace = function() {
    var bundle = new Bundle();

    this.addEndpoint = function(name, pipeline) {
      bundle.addPart(name, 'endpoint', pipeline);
    };

    this.getEndpoint = function(name) {
      return bundle.getPartData(name);
    };
  };

  return Namespace;
}());
