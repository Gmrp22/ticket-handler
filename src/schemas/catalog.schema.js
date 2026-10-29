const { z } = require('zod');
const { typeError } = require('./common.schema');

const text = z
  .string(typeError('a text'))
  .trim()
  .min(1, 'cannot be empty')
  .max(255, 'must have at most 255 characters');

// Body of suppliers, lands and products, the three have the same fields
const catalogSchema = z.object(
  { code: text, name: text },
  { error: 'the body must be a JSON object' },
);

module.exports = { catalogSchema };
