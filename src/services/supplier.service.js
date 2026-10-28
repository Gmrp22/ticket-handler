const { Supplier } = require('../models');
const { DatabaseError } = require('../utils/errors');

const getAll = async () => {
  try {
    return await Supplier.findAll({ order: [['id', 'ASC']] });
  } catch (error) {
    throw new DatabaseError('Could not get suppliers', { cause: error });
  }
};

module.exports = { getAll };
