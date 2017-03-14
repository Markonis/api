module.exports = (function() {
  var Endpoint = function(chain) {
    var pipeline = Endpoint.createPipeline(chain);

    this.execute = function(bundle) {
      return pipeline(bundle);
    };
  };

  Endpoint.createPipeline = function(processors) {
    function wrapProcessor(processor) {
      return function(bundle) {
        var status = bundle.getPartData('status') || 200;
        if (status < 400) {
          return processor(bundle);
        }
        else {
          return bundle;
        }
      };
    }

    return function(bundle) {
      var start = new Promise(function(resolve) {
        resolve(bundle);
      });

      var current = start;
      for (var i = 0; i < processors.length; i++) {
        current = current.then(wrapProcessor(processors[i]));
      }

      return current;
    };
  };

  return Endpoint;
}());