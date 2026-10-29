const paymentService = require('../services/payment.service');
const { paymentQuerySchema } = require('../schemas/payment.schema');

const getWeekly = async (req, res) => {
  const payments = await paymentService.getWeekly(paymentQuerySchema.parse(req.query));
  res.json(payments);
};

module.exports = { getWeekly };
