const { z } = require('zod');
const { typeError, oneOf } = require('./common.schema');

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

const SORT_FIELDS = ['id', 'code', 'name'];

// Optional: without sort and order the list comes by id, from the first to the last
const catalogListQuerySchema = z.object({
  sort: z.enum(SORT_FIELDS, oneOf(SORT_FIELDS)).default('id'),
  order: z.enum(['asc', 'desc'], oneOf(['asc', 'desc'])).default('asc'),
});

module.exports = { catalogSchema, catalogListQuerySchema };
