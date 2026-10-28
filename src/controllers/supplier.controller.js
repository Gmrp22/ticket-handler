const supplierService = require('../services/supplier.service');

const getAll = async (req, res) => {
  const suppliers = await supplierService.getAll();
  res.json(suppliers);
};

module.exports = { getAll };
