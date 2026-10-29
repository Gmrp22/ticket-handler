const { literal, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const { sequelize, Ticket, Supplier, Land, TicketItem, Product } = require('../models');
const {
  BadRequestError,
  ConflictError,
  DatabaseError,
  NotFoundError,
} = require('../utils/errors');

// The total of a ticket is the sum of quantity x price of its items
const TOTAL = literal(
  '(SELECT ROUND(COALESCE(SUM(quantity * price), 0), 3) FROM ticket_items WHERE ticket_items.ticket_id = "Ticket".id)',
);

const getAll = async ({ page, limit, sort, order }) => {
  try {
    const { rows, count } = await Ticket.findAndCountAll({
      attributes: { include: [[TOTAL, 'total']] },
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'code', 'name'] },
        { model: Land, as: 'land', attributes: ['id', 'code', 'name'] },
      ],
      // id as second sort makes the order stable when two tickets have the same value
      order: [
        [sort, order.toUpperCase()],
        ['id', order.toUpperCase()],
      ],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    };
  } catch (error) {
    throw new DatabaseError('Could not get tickets', { cause: error });
  }
};

const getById = async (id) => {
  let ticket;
  try {
    ticket = await Ticket.findByPk(id, {
      attributes: { include: [[TOTAL, 'total']] },
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'code', 'name'] },
        { model: Land, as: 'land', attributes: ['id', 'code', 'name'] },
        {
          model: TicketItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'code', 'name'] }],
        },
      ],
      order: [[{ model: TicketItem, as: 'items' }, 'id', 'ASC']],
    });
  } catch (error) {
    throw new DatabaseError('Could not get ticket', { cause: error });
  }

  if (!ticket) throw new NotFoundError('Ticket not found');
  return ticket;
};

const create = async ({ code, date, supplierId, landId, items }) => {
  let ticketId;
  try {
    // Ticket and items are saved together: if one fails, nothing is saved
    ticketId = await sequelize.transaction(async (transaction) => {
      const ticket = await Ticket.create({ code, date, supplierId, landId }, { transaction });

      await TicketItem.bulkCreate(
        items.map(({ productId, quantity, price }) => ({
          ticketId: ticket.id,
          productId,
          quantity,
          price,
        })),
        { transaction },
      );

      return ticket.id;
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ConflictError('Ticket code already exists');
    }
    if (error instanceof ForeignKeyConstraintError) {
      throw new BadRequestError('Supplier, land or product does not exist');
    }
    throw new DatabaseError('Could not create ticket', { cause: error });
  }

  return getById(ticketId);
};

const findTicket = async (id) => {
  let ticket;
  try {
    ticket = await Ticket.findByPk(id);
  } catch (error) {
    throw new DatabaseError('Could not get ticket', { cause: error });
  }

  if (!ticket) throw new NotFoundError('Ticket not found');
  return ticket;
};

const update = async (id, { code, date, supplierId, landId, items }) => {
  const ticket = await findTicket(id);

  try {
    // The items are replaced: the old ones are deleted and the new ones are created
    await sequelize.transaction(async (transaction) => {
      await ticket.update({ code, date, supplierId, landId }, { transaction });
      await TicketItem.destroy({ where: { ticketId: ticket.id }, transaction });
      await TicketItem.bulkCreate(
        items.map(({ productId, quantity, price }) => ({
          ticketId: ticket.id,
          productId,
          quantity,
          price,
        })),
        { transaction },
      );
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ConflictError('Ticket code already exists');
    }
    if (error instanceof ForeignKeyConstraintError) {
      throw new BadRequestError('Supplier, land or product does not exist');
    }
    throw new DatabaseError('Could not update ticket', { cause: error });
  }

  return getById(ticket.id);
};

const remove = async (id) => {
  const ticket = await findTicket(id);

  try {
    // The items are deleted by the database (CASCADE)
    await ticket.destroy();
  } catch (error) {
    throw new DatabaseError('Could not delete ticket', { cause: error });
  }
};

module.exports = { getAll, getById, create, update, remove, TOTAL };
