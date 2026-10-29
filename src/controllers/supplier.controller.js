const supplierService = require('../services/supplier.service');
const { idParamsSchema } = require('../schemas/common.schema');
const { catalogSchema } = require('../schemas/catalog.schema');

const getAll = async (req, res) => {
  const suppliers = await supplierService.getAll();
  res.json(suppliers);
};

const getById = async (req, res) => {
  const supplier = await supplierService.getById(idParamsSchema.parse(req.params).id);
  res.json(supplier);
};

const create = async (req, res) => {
  const supplier = await supplierService.create(catalogSchema.parse(req.body));
  res.status(201).json(supplier);
};

const update = async (req, res) => {
  const supplier = await supplierService.update(
    idParamsSchema.parse(req.params).id,
    catalogSchema.parse(req.body),
  );
  res.json(supplier);
};

const remove = async (req, res) => {
  await supplierService.remove(idParamsSchema.parse(req.params).id);
  res.status(204).send();
};

module.exports = { getAll, getById, create, update, remove };
