const { UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const { Land } = require('../models');
const {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ForeignKeyViolationError,
} = require('../utils/errors');

const getAll = async ({ sort, order }) => {
  try {
    return await Land.findAll({
      order: [
        [sort, order.toUpperCase()],
        ['id', 'ASC'],
      ],
    });
  } catch (error) {
    throw new DatabaseError('Could not get lands', { cause: error });
  }
};

const getById = async (id) => {
  let land;
  try {
    land = await Land.findByPk(id);
  } catch (error) {
    throw new DatabaseError('Could not get land', { cause: error });
  }

  if (!land) throw new NotFoundError('Land not found');
  return land;
};

const create = async ({ code, name }) => {
  try {
    return await Land.create({ code, name });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ConflictError('Land code already exists');
    }
    throw new DatabaseError('Could not create land', { cause: error });
  }
};

const update = async (id, { code, name }) => {
  const land = await getById(id);

  try {
    return await land.update({ code, name });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ConflictError('Land code already exists');
    }
    throw new DatabaseError('Could not update land', { cause: error });
  }
};

const remove = async (id) => {
  const land = await getById(id);

  try {
    await land.destroy();
  } catch (error) {
    // 23001 is the PostgreSQL code for a violated RESTRICT rule, Sequelize does not translate it
    if (error instanceof ForeignKeyConstraintError || error.parent?.code === '23001') {
      throw new ForeignKeyViolationError('Land has tickets and cannot be deleted');
    }
    throw new DatabaseError('Could not delete land', { cause: error });
  }
};

module.exports = { getAll, getById, create, update, remove };
