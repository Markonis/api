var ApiController = require(process.cwd() + '/lib/controller.js');
var ApiNamespace = require(process.cwd() + '/lib/namespace.js');
var Bundle = require('@markonis/bundle');
var expect = require('expect.js');


describe('ApiController', function() {
  beforeEach(function() {
    this.bundle = new Bundle();
    this.apiNamespace = new ApiNamespace();
    this.controller = new ApiController({
      apiNamespace: this.apiNamespace
    });
  });

  describe('executeEndpoint(bundle)', function() {
    it('invokes endpoint.execute(bundle)', function() {
      var bundle = this.bundle;
      var executed = false;

      bundle.addPart('endpoint', 'endpoint', {
        execute: function(bundle) {
          executed = true;
          return bundle;
        }
      });

      this.controller.executeEndpoint(bundle);
      expect(executed).to.be(true);
    });
  });

  describe('sendResponse(res)', function() {
    beforeEach(function() {
      var test = this;
      test.sentStatus = null;
      test.sentData = null;

      this.bundle.addPart('result', 'result', 'result-data');
      this.bundle.addPart(null, 'devError', 'dev-error-data');
      this.bundle.addPart(null, 'userError', 'user-error-data');

      this.controller.sendJson = function(res, status, data) {
        test.sentStatus = status;
        test.sentData = data;
      };
    });

    it('returns a function that invokes sendJson', function() {
      this.controller.sendResponse(null)(this.bundle);
      expect(this.sentData).to.not.be(null);
      expect(this.sentStatus).to.not.be(null);
    });

    context('given a status code < 400', function() {
      beforeEach(function() {
        this.bundle.addPart('status', 'status', 200);
      });

      it('returns the result as json', function() {
        this.controller.sendResponse(null)(this.bundle);
        expect(this.sentData).to.be('result-data');
        expect(this.sentStatus).to.be(200);
      });
    });

    context('given a status code > 400', function() {
      beforeEach(function() {
        this.bundle.addPart('status', 'status', 422);
      });

      it('returns the userErrors and devErrors in non-production', function() {
        this.controller.sendResponse(null)(this.bundle);
        expect(this.sentData.devErrors).to.eql(['dev-error-data']);
        expect(this.sentData.userErrors).to.eql(['user-error-data']);
        expect(this.sentStatus).to.be(422);
      });
    });
  });

  describe('handleError(res, bundle)', function() {
    it('returns a function that sends status 400', function() {
      this.bundle.addPart(null, 'devError', 'error1-data');
      this.controller.handleError(null, this.bundle)('error2-data');

      expect(this.bundle.getPartData('status')).to.eql(500);
      expect(this.bundle.getPartsData('devError'))
        .to.eql(['error1-data', 'error2-data']);
    });
  });
});
