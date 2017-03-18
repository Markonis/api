var Bundle = require('@markonis/bundle');
var Options = require('@markonis/options');
var pipeline = require('./pipeline.js');
var multer = require('multer');

module.exports = (function() {
  var Controller = function(params) {
    var self = this;
    var options = new Options(params, {
      apiNamespace: null,
      allowUploads: false,
      multerConfig: {
        dest: 'tmp/uploads/'
      }
    });

    var apiNamespace = options.get('apiNamespace');
    var allowUploads = options.get('allowUploads');
    var multerConfig = options.get('multerConfig');
    var multerAccept = null;

    // Accept file
    this.getMulterAccept = function() {
      if (multerAccept == null)
        multerAccept = multer(multerConfig).any();
      return multerAccept;
    };

    this.acceptFile = function(req, res) {
      return function(bundle) {
        return new Promise(function(resolve) {
          var multerAccept = self.getMulterAccept();

          multerAccept(req, res, function(err) {
            if (err) {
              bundle.addPart(null, 'devError', 'Upload failed.');
              bundle.updatePart('status', 'status', 500);
            }
            else {
              bundle.addPart('files', 'files', req.files);
            }
            resolve(bundle);
          });
        });
      };
    };

    // Add query name
    this.addEndpointName = function(req) {
      return function(bundle) {
        bundle.addPart('endpointName', 'endpointName', req.body.endpointName);
        return bundle;
      };
    };

    // Create the request bundle
    this.addParams = function(req) {
      return function(bundle) {
        bundle.addPart('params', 'params', req.body.params);
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
      var endpoint = bundle.getPartData('endpoint');
      return endpoint.execute(bundle);
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
      var bundle = new Bundle();
      var chain = [];

      if (allowUploads) chain.push(self.acceptFile(req, res));
      chain.push(self.addEndpointName(req));
      chain.push(self.addParams(req));
      chain.push(self.getEndpoint);
      chain.push(self.executeEndpoint);

      var processRequest = pipeline(chain);

      processRequest(bundle)
        .catch(self.handleError(res, bundle))
        .then(self.sendResponse(res));
    };
  };

  return Controller;
}());
