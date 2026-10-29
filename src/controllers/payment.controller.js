const paymentService = require('../services/payment.service');
const { BadRequestError } = require('../utils/errors');

const getWeekly = async (req, res) => {
  const year = Number(req.query.year);
  const week = Number(req.query.week);

  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new BadRequestError('year must be a number between 1900 and 2100');
  }
  if (!Number.isInteger(week) || week < 1 || week > 53) {
    throw new BadRequestError('week must be a number between 1 and 53');
  }

  const payments = await paymentService.getWeekly({ year, week });
  res.json(payments);
};

module.exports = { getWeekly };
