const paymentService = require('../services/payment.service');
const { BadRequestError } = require('../utils/errors');

// Only these fields can be used to sort the suppliers
const SORT_FIELDS = ['name', 'code'];

const getWeekly = async (req, res) => {
  const year = Number(req.query.year);
  const week = Number(req.query.week);
  const sort = String(req.query.sort ?? 'name');
  const order = String(req.query.order ?? 'asc').toLowerCase();

  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new BadRequestError('year must be a number between 1900 and 2100');
  }
  if (!Number.isInteger(week) || week < 1 || week > 53) {
    throw new BadRequestError('week must be a number between 1 and 53');
  }
  if (!SORT_FIELDS.includes(sort)) {
    throw new BadRequestError(`sort must be one of: ${SORT_FIELDS.join(', ')}`);
  }
  if (!['asc', 'desc'].includes(order)) {
    throw new BadRequestError('order must be asc or desc');
  }

  const payments = await paymentService.getWeekly({ year, week, sort, order });
  res.json(payments);
};

module.exports = { getWeekly };
