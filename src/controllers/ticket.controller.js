const ticketService = require('../services/ticket.service');

const getAll = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const tickets = await ticketService.getAll({ page, limit });
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
