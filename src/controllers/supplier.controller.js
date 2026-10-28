const supplierService = require('../services/supplier.service');

const getAll = async (req, res) => {
  const suppliers = await supplierService.getAll();
  res.json(suppliers);
};

const getById = async (req, res) => {
  const supplier = await supplierService.getById(req.params.id);
  res.json(supplier);
};

const create = async (req, res) => {
  const supplier = await supplierService.create(req.body);
  res.status(201).json(supplier);
};

const update = async (req, res) => {
  const supplier = await supplierService.update(req.params.id, req.body);
  res.json(supplier);
};

const remove = async (req, res) => {
  await supplierService.remove(req.params.id);
  res.status(204).send();
};

module.exports = { getAll, getById, create, update, remove };
