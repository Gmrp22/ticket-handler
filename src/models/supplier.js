const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define(
  'Supplier',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: 'suppliers',
    underscored: true,
  },
);

module.exports = Supplier;
