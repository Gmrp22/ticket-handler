const sequelize = require('../config/database');
const Supplier = require('./supplier');
const Land = require('./land');
const Product = require('./product');
const Ticket = require('./ticket');
const TicketItem = require('./ticket-item');

// Supplier 1 - N Ticket
Supplier.hasMany(Ticket, { foreignKey: 'supplierId', as: 'tickets' });
Ticket.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// Land 1 - N Ticket
Land.hasMany(Ticket, { foreignKey: 'landId', as: 'tickets' });
Ticket.belongsTo(Land, { foreignKey: 'landId', as: 'land' });

// Ticket 1 - N TicketItem
Ticket.hasMany(TicketItem, { foreignKey: 'ticketId', as: 'items' });
TicketItem.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });

// Product 1 - N TicketItem
Product.hasMany(TicketItem, { foreignKey: 'productId', as: 'ticketItems' });
TicketItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = {
  sequelize,
  Supplier,
  Land,
  Product,
  Ticket,
  TicketItem,
};
