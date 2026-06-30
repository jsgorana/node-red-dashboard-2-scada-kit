const Ajv = require('ajv');
const { BINDING_SCHEMA } = require('./schema');

const ajv = new Ajv({ allErrors: true });
const validateFn = ajv.compile(BINDING_SCHEMA);

/**
 * Validate and parse a binding config JSON object.
 * Returns { valid, errors, bindings, events }.
 */
function parse(config) {
  const valid = validateFn(config);
  return {
    valid,
    errors: valid ? [] : (validateFn.errors || []).map((e) => `${e.instancePath} ${e.message}`),
    bindings: valid ? (config.bindings || []) : [],
    events:   valid ? (config.events   || []) : [],
  };
}

module.exports = { parse };
