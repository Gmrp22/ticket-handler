const { z } = require('zod');

// Body of suppliers, lands and products, the three have the same fields
const catalogSchema = z.object({
  code: z.string().trim().min(1).max(255),
  name: z.string().trim().min(1).max(255),
});

module.exports = { catalogSchema };
