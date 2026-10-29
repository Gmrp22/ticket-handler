const { z } = require('zod');
const { typeError, oneOf, urlNumber } = require('./common.schema');

const SORT_FIELDS = ['date', 'code', 'id'];

const id = z
  .number(typeError('a whole number'))
  .int('must be a whole number')
  .positive('must be greater than 0');

// quantity and price are DECIMAL(12, 3): up to 9 digits before the point
const decimal = z
  .number(typeError('a number'))
  .min(0, 'cannot be negative')
  .max(999999999, 'is too big');

const itemSchema = z.object({ productId: id, quantity: decimal, price: decimal });

const ticketSchema = z.object(
  {
    code: z
      .string(typeError('a text'))
      .trim()
      .min(1, 'cannot be empty')
      .max(255, 'must have at most 255 characters'),
    date: z.iso.date('must be a valid date in the format YYYY-MM-DD'),
    supplierId: id,
    landId: id,
    items: z.array(itemSchema, typeError('a list')).min(1, 'must have at least one item'),
  },
  { error: 'the body must be a JSON object' },
);

const ticketListQuerySchema = z.object({
  page: urlNumber('a number', (number) => number.min(1, 'must be 1 or more')).default(1),
  limit: urlNumber('a number', (number) =>
    number.min(1, 'must be 1 or more').max(100, 'must be 100 or less'),
  ).default(20),
  sort: z.enum(SORT_FIELDS, oneOf(SORT_FIELDS)).default('date'),
  order: z.enum(['asc', 'desc'], oneOf(['asc', 'desc'])).default('desc'),
});

module.exports = { ticketSchema, ticketListQuerySchema };
