const { z } = require('zod');
const { oneOf, urlNumber } = require('./common.schema');

const SORT_FIELDS = ['name', 'code'];

const paymentQuerySchema = z.object({
  year: urlNumber('a whole number', (number) =>
    number.min(1900, 'must be between 1900 and 2100').max(2100, 'must be between 1900 and 2100'),
  ),
  week: urlNumber('a whole number', (number) =>
    number.min(1, 'must be between 1 and 53').max(53, 'must be between 1 and 53'),
  ),
  sort: z.enum(SORT_FIELDS, oneOf(SORT_FIELDS)).default('name'),
  order: z.enum(['asc', 'desc'], oneOf(['asc', 'desc'])).default('asc'),
});

module.exports = { paymentQuerySchema };
