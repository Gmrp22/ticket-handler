const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ticket = sequelize.define(
  'Ticket',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    supplierId: { type: DataTypes.INTEGER, allowNull: false },
    landId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'tickets',
    underscored: true,
  },
);

module.exports = Ticket;
