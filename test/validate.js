var validate = require(process.cwd() + '/lib/validate.js');
var expect = require('expect.js');
var Bundle = require('@markonis/bundle');

describe('paramsValidator', function() {
  describe('validate', function() {
    beforeEach(function() {
      this.bundle = new Bundle();
      this.bundle.addPart('params', 'params', {
        a: '1',
        b: 2.5,
        c: null
      });

      validate({
        type: 'object',
        properties: {
          a: {
            type: 'string'
          },
          b: {
            type: 'integer'
          },
          c: {
            type: 'boolean',
          },
          d: {
            type: 'string'
          }
        },
        required: ['d']
      })(this.bundle);
    });

    it('adds errors to the bundle', function() {
      var errorsData = this.bundle.getPartsData('devError');
      expect(errorsData.length).to.be(3);
    });

    it('sets status to 422 if there are errors', function() {
      var status = this.bundle.getPartData('status');
      expect(status).to.be(422);
    });
  });
});
