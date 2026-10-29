const { z } = require('zod');

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

module.exports = { idParamsSchema };
