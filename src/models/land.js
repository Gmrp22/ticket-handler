const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Land = sequelize.define(
  'Land',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: 'lands',
    underscored: true,
  },
);

module.exports = Land;
