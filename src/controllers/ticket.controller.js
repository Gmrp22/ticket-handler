const ticketService = require('../services/ticket.service');
const { BadRequestError } = require('../utils/errors');

// Only these fields can be used to sort the list
const SORT_FIELDS = ['date', 'code', 'id'];

const getAll = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const sort = String(req.query.sort ?? 'date');
  const order = String(req.query.order ?? 'desc').toLowerCase();

  if (!SORT_FIELDS.includes(sort)) {
    throw new BadRequestError(`sort must be one of: ${SORT_FIELDS.join(', ')}`);
  }
  if (!['asc', 'desc'].includes(order)) {
    throw new BadRequestError('order must be asc or desc');
  }

  const tickets = await ticketService.getAll({ page, limit, sort, order });
  res.json(tickets);
};

const getById = async (req, res) => {
  const ticket = await ticketService.getById(req.params.id);
  res.json(ticket);
};

const create = async (req, res) => {
  const ticket = await ticketService.create(req.body);
  res.status(201).json(ticket);
};

const update = async (req, res) => {
  const ticket = await ticketService.update(req.params.id, req.body);
  res.json(ticket);
};

const remove = async (req, res) => {
  await ticketService.remove(req.params.id);
  res.status(204).send();
};

module.exports = { getAll, getById, create, update, remove };
