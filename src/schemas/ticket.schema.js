const { z } = require('zod');

const id = z.number().int().positive();

// quantity and price are DECIMAL(12, 3): up to 9 digits before the point
const itemSchema = z.object({
  productId: id,
  quantity: z.number().min(0).max(999999999),
  price: z.number().min(0).max(999999999),
});

const ticketSchema = z.object({
  code: z.string().trim().min(1).max(255),
  date: z.iso.date(),
  supplierId: id,
  landId: id,
  items: z.array(itemSchema).min(1),
});

const ticketListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['date', 'code', 'id']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

module.exports = { ticketSchema, ticketListQuerySchema };
