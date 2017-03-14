var _ = require('underscore');
var Ajv = require('ajv');

module.exports = (function() {
  function validate(schema) {
    return function(bundle) {
      var paramsData = bundle.getPartData('params');
      var validator = new Ajv({
        allErrors: true
      });
      var valid = validator.validate(schema, paramsData);

      if (!valid) {
        bundle.updatePart('status', 'status', 422);
        _.each(validator.errors, function(error) {
          bundle.addPart(null, 'devError', error);
        });
      }
      return bundle;
    };
  }

  return validate;
}());
