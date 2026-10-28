const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TicketItem = sequelize.define(
  'TicketItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ticket_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
  },
  {
    tableName: 'ticket_items',
    underscored: true,
  },
);

module.exports = TicketItem;
