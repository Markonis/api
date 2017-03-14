var Bundle = require('@markonis/bundle');
var Endpoint = require(process.cwd() + '/lib/endpoint.js');
var expect = require('expect.js');
var _ = require('underscore');

describe('Endpoint', function() {
  describe('createPipeline', function() {
    it('returns a function which invokes all processors in sequence', function(done) {
      var bundle = new Bundle();
      bundle.addPart('status', 'status', 200);

      var counter = function(number, bundle) {
        bundle.addPart(null, 'counter', number);
        return bundle;
      };

      var error = function(bundle) {
        bundle.updatePart('status', 'status', 422);
        return bundle;
      };

      var pipeline = Endpoint.createPipeline([
        _.partial(counter, 1),
        _.partial(counter, 2),
        error,
        _.partial(counter, 3),
        _.partial(counter, 4)
      ]);

      pipeline(bundle).then(function(bundle) {
        var counterData = bundle.getPartsData('counter');
        expect(counterData).to.eql([1, 2]);
        done();
      });
    });
  });
});
