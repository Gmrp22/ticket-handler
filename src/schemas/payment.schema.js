const { z } = require('zod');

const paymentQuerySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100),
  week: z.coerce.number().int().min(1).max(53),
  sort: z.enum(['name', 'code']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

module.exports = { paymentQuerySchema };
