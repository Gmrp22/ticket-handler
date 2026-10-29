const { UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const { Product } = require('../models');
const {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ForeignKeyViolationError,
} = require('../utils/errors');

const getAll = async ({ sort, order }) => {
  try {
    return await Product.findAll({
      order: [
        [sort, order.toUpperCase()],
        ['id', 'ASC'],
      ],
    });
  } catch (error) {
    throw new DatabaseError('Could not get products', { cause: error });
  }
};

const getById = async (id) => {
  let product;
  try {
    product = await Product.findByPk(id);
  } catch (error) {
    throw new DatabaseError('Could not get product', { cause: error });
  }

  if (!product) throw new NotFoundError('Product not found');
  return product;
};

const create = async ({ code, name }) => {
  try {
    return await Product.create({ code, name });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ConflictError('Product code already exists');
    }
    throw new DatabaseError('Could not create product', { cause: error });
  }
};

const update = async (id, { code, name }) => {
  const product = await getById(id);

  try {
    return await product.update({ code, name });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ConflictError('Product code already exists');
    }
    throw new DatabaseError('Could not update product', { cause: error });
  }
};

const remove = async (id) => {
  const product = await getById(id);

  try {
    await product.destroy();
  } catch (error) {
    // 23001 is the PostgreSQL code for a violated RESTRICT rule, Sequelize does not translate it
    if (error instanceof ForeignKeyConstraintError || error.parent?.code === '23001') {
      throw new ForeignKeyViolationError('Product is used in tickets and cannot be deleted');
    }
    throw new DatabaseError('Could not delete product', { cause: error });
  }
};

module.exports = { getAll, getById, create, update, remove };
