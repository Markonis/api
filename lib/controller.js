var Bundle = require('@markonis/bundle');
var Options = require('@markonis/options');

module.exports = (function() {
  var Controller = function(params) {
    var self = this;
    var apiNamespace = null;

    var options = new Options(params, {
      apiNamespace: null
    });

    apiNamespace = options.get('apiNamespace');

    // Start chain
    this.startChain = function(bundle) {
      return new Promise(function(resolve) {
        resolve(bundle);
      });
    };

    // Add query name
    this.addEndpointName = function(endpointName) {
      return function(bundle) {
        bundle.addPart('endpointName', 'endpointName', endpointName);
        return bundle;
      };
    };

    // Create the request bundle
    this.addParams = function(params) {
      return function(bundle) {
        bundle.addPart('params', 'params', params);
        return bundle;
      };
    };

    // Get endpoint
    this.getEndpoint = function(bundle) {
      var endpointName = bundle.getPartData('endpointName');
      var endpoint = apiNamespace.getEndpoint(endpointName);

      if (endpoint) {
        bundle.addPart('endpoint', 'endpoint', endpoint);
        return bundle;
      }
      else {
        bundle.addPart(null, 'devError', 'The API endpoint doesn\'t exist.');
        bundle.updatePart('status', 'status', 422);
      }

      return bundle;
    };

    // Execute endpoint
    this.executeEndpoint = function(bundle) {
      var status = self.getStatus(bundle);
      if (status < 400) {
        var endpoint = bundle.getPartData('endpoint');
        return endpoint.execute(bundle);
      }
      else {
        return bundle;
      }
    };

    // Handle internal server error
    this.handleError = function(res, bundle) {
      return function(errorData) {
        bundle.addPart(null, 'devError', errorData);
        bundle.updatePart('status', 'status', 500);
        return bundle;
      };
    };

    this.getStatus = function(bundle) {
      return bundle.getPartData('status') || 200;
    };

    this.sendJson = function(res, status, data) {
      res.status(status);
      res.json(data);
    };

    this.sendResponse = function(res) {
      return function(bundle) {
        var status = self.getStatus(bundle);
        var data = null;

        if (status < 400) {
          data = bundle.getPartData('result');
        }
        else {
          data = {
            userErrors: bundle.getPartsData('userError'),
            devErrors: bundle.getPartsData('devError')
          };
        }

        self.sendJson(res, status, data);
        return bundle;
      };
    };

    // Handle request
    this.handleRequest = function(req, res) {
      var endpointName = req.body.endpointName;
      var params = req.body.params;
      var bundle = new Bundle();

      self.startChain(bundle)
        .then(self.addEndpointName(endpointName))
        .then(self.addParams(params))
        .then(self.getEndpoint)
        .then(self.executeEndpoint)
        .catch(self.handleError(res, bundle))
        .then(self.sendResponse(res));
    };
  };

  return Controller;
}());
