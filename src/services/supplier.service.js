const { UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const { Supplier } = require('../models');
const {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ForeignKeyViolationError,
} = require('../utils/errors');

const getAll = async () => {
  try {
    return await Supplier.findAll({ order: [['id', 'ASC']] });
  } catch (error) {
    throw new DatabaseError('Could not get suppliers', { cause: error });
  }
};

const getById = async (id) => {
  let supplier;
  try {
    supplier = await Supplier.findByPk(id);
  } catch (error) {
    throw new DatabaseError('Could not get supplier', { cause: error });
  }

  if (!supplier) throw new NotFoundError('Supplier not found');
  return supplier;
};

const create = async ({ code, name }) => {
  try {
    return await Supplier.create({ code, name });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ConflictError('Supplier code already exists');
    }
    throw new DatabaseError('Could not create supplier', { cause: error });
  }
};

const update = async (id, { code, name }) => {
  const supplier = await getById(id);

  try {
    return await supplier.update({ code, name });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ConflictError('Supplier code already exists');
    }
    throw new DatabaseError('Could not update supplier', { cause: error });
  }
};

const remove = async (id) => {
  const supplier = await getById(id);

  try {
    await supplier.destroy();
  } catch (error) {
    // 23001 is the PostgreSQL code for a violated RESTRICT rule, Sequelize does not translate it
    if (error instanceof ForeignKeyConstraintError || error.parent?.code === '23001') {
      throw new ForeignKeyViolationError('Supplier has tickets and cannot be deleted');
    }
    throw new DatabaseError('Could not delete supplier', { cause: error });
  }
};

module.exports = { getAll, getById, create, update, remove };
