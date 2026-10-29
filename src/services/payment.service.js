const { fn, literal, where, Op } = require('sequelize');
const { Ticket, Supplier } = require('../models');
const { TOTAL } = require('./ticket.service');
const { DatabaseError } = require('../utils/errors');

// The totals come as text ("6845.000"). We add them as thousandths (whole numbers) so there are no decimal errors
const toThousandths = (total) => Math.round(Number(total) * 1000);
const fromThousandths = (value) => (value / 1000).toFixed(3);

const getWeekly = async ({ year, week }) => {
  let tickets;
  try {
    // PostgreSQL gets the ISO week of each date: EXTRACT(isoyear FROM date) and EXTRACT(week FROM date)
    tickets = await Ticket.findAll({
      attributes: ['id', 'code', 'date', [TOTAL, 'total']],
      where: {
        [Op.and]: [
          where(fn('EXTRACT', literal('isoyear FROM "Ticket"."date"')), year),
          where(fn('EXTRACT', literal('week FROM "Ticket"."date"')), week),
        ],
      },
      include: [{ model: Supplier, attributes: ['id', 'code', 'name'] }],
      order: [
        ['supplier_id', 'ASC'],
        ['date', 'ASC'],
        ['id', 'ASC'],
      ],
    });
  } catch (error) {
    throw new DatabaseError('Could not get payments', { cause: error });
  }

  // The tickets come ordered by supplier, so a new supplier starts when its id changes
  const suppliers = [];
  let weekTotal = 0;
  for (const ticket of tickets) {
    const { id, code, date, total, Supplier: supplier } = ticket.get({ plain: true });

    if (suppliers.at(-1)?.supplier.id !== supplier.id) {
      suppliers.push({ supplier, total: 0, tickets: [] });
    }
    const current = suppliers.at(-1);
    current.tickets.push({ id, code, date, total });
    current.total += toThousandths(total);
    weekTotal += toThousandths(total);
  }

  return {
    year,
    week,
    total: fromThousandths(weekTotal),
    suppliers: suppliers.map((item) => ({ ...item, total: fromThousandths(item.total) })),
  };
};

module.exports = { getWeekly };
