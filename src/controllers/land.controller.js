const landService = require('../services/land.service');
const { idParamsSchema } = require('../schemas/common.schema');
const { catalogSchema, catalogListQuerySchema } = require('../schemas/catalog.schema');

const getAll = async (req, res) => {
  const lands = await landService.getAll(catalogListQuerySchema.parse(req.query));
  res.json(lands);
};

const getById = async (req, res) => {
  const land = await landService.getById(idParamsSchema.parse(req.params).id);
  res.json(land);
};

const create = async (req, res) => {
  const land = await landService.create(catalogSchema.parse(req.body));
  res.status(201).json(land);
};

const update = async (req, res) => {
  const land = await landService.update(
    idParamsSchema.parse(req.params).id,
    catalogSchema.parse(req.body),
  );
  res.json(land);
};

const remove = async (req, res) => {
  await landService.remove(idParamsSchema.parse(req.params).id);
  res.status(204).send();
};

module.exports = { getAll, getById, create, update, remove };
