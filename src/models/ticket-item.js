const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TicketItem = sequelize.define(
  'TicketItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ticketId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
  },
  {
    tableName: 'ticket_items',
    underscored: true,
  },
);

module.exports = TicketItem;
