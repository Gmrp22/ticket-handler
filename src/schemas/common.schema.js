const { z } = require('zod');

// Messages of the validation errors. The error handler writes them after the name of the field,
// for example "items.0.price: must be a number"
const typeError = (type) => ({
  error: (issue) => (issue.input === undefined ? 'is required' : `must be ${type}`),
});
const oneOf = (values) => ({ error: `must be one of: ${values.join(', ')}` });

// A whole number that comes in the URL, so it is a text. `rules` adds the limits of each field
const urlNumber = (type, rules) =>
  z.preprocess(
    (value) => (value === undefined ? undefined : Number(value)),
    rules(z.number(typeError(type)).int('must be a whole number')),
  );

const idParamsSchema = z.object({
  id: urlNumber('a whole number', (number) => number.positive('must be greater than 0')),
});

module.exports = { typeError, oneOf, urlNumber, idParamsSchema };
