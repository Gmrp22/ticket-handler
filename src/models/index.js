const sequelize = require('../config/database');
const Supplier = require('./supplier');
const Land = require('./land');
const Product = require('./product');
const Ticket = require('./ticket');
const TicketItem = require('./ticket-item');

// Supplier 1 - N Ticket
Supplier.hasMany(Ticket, { foreignKey: 'supplier_id' });
Ticket.belongsTo(Supplier, { foreignKey: 'supplier_id' });

// Land 1 - N Ticket
Land.hasMany(Ticket, { foreignKey: 'land_id' });
Ticket.belongsTo(Land, { foreignKey: 'land_id' });

// Ticket 1 - N TicketItem
Ticket.hasMany(TicketItem, { foreignKey: 'ticket_id' });
TicketItem.belongsTo(Ticket, { foreignKey: 'ticket_id' });

// Product 1 - N TicketItem
Product.hasMany(TicketItem, { foreignKey: 'product_id' });
TicketItem.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = {
  sequelize,
  Supplier,
  Land,
  Product,
  Ticket,
  TicketItem,
};
