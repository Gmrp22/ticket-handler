const landService = require('../services/land.service');

const getAll = async (req, res) => {
  const lands = await landService.getAll();
  res.json(lands);
};

const getById = async (req, res) => {
  const land = await landService.getById(req.params.id);
  res.json(land);
};

const create = async (req, res) => {
  const land = await landService.create(req.body);
  res.status(201).json(land);
};

const update = async (req, res) => {
  const land = await landService.update(req.params.id, req.body);
  res.json(land);
};

const remove = async (req, res) => {
  await landService.remove(req.params.id);
  res.status(204).send();
};

module.exports = { getAll, getById, create, update, remove };
