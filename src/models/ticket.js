const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ticket = sequelize.define(
  'Ticket',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    supplier_id: { type: DataTypes.INTEGER, allowNull: false },
    land_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'tickets',
    underscored: true,
  },
);

module.exports = Ticket;
