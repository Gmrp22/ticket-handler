const productService = require('../services/product.service');
const { idParamsSchema } = require('../schemas/common.schema');
const { catalogSchema, catalogListQuerySchema } = require('../schemas/catalog.schema');

const getAll = async (req, res) => {
  const products = await productService.getAll(catalogListQuerySchema.parse(req.query));
  res.json(products);
};

const getById = async (req, res) => {
  const product = await productService.getById(idParamsSchema.parse(req.params).id);
  res.json(product);
};

const create = async (req, res) => {
  const product = await productService.create(catalogSchema.parse(req.body));
  res.status(201).json(product);
};

const update = async (req, res) => {
  const product = await productService.update(
    idParamsSchema.parse(req.params).id,
    catalogSchema.parse(req.body),
  );
  res.json(product);
};

const remove = async (req, res) => {
  await productService.remove(idParamsSchema.parse(req.params).id);
  res.status(204).send();
};

module.exports = { getAll, getById, create, update, remove };
