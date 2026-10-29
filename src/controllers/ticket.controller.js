const ticketService = require('../services/ticket.service');
const { idParamsSchema } = require('../schemas/common.schema');
const { ticketSchema, ticketListQuerySchema } = require('../schemas/ticket.schema');

const getAll = async (req, res) => {
  const tickets = await ticketService.getAll(ticketListQuerySchema.parse(req.query));
  res.json(tickets);
};

const getById = async (req, res) => {
  const ticket = await ticketService.getById(idParamsSchema.parse(req.params).id);
  res.json(ticket);
};

const create = async (req, res) => {
  const ticket = await ticketService.create(ticketSchema.parse(req.body));
  res.status(201).json(ticket);
};

const update = async (req, res) => {
  const ticket = await ticketService.update(
    idParamsSchema.parse(req.params).id,
    ticketSchema.parse(req.body),
  );
  res.json(ticket);
};

const remove = async (req, res) => {
  await ticketService.remove(idParamsSchema.parse(req.params).id);
  res.status(204).send();
};

module.exports = { getAll, getById, create, update, remove };
