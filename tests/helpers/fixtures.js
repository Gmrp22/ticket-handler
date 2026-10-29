const { Supplier, Land, Product, Ticket, TicketItem } = require('../../src/models');

// A supplier, a land and two products to build tickets
const createBase = async () => ({
  supplier: await Supplier.create({ code: 'BASE-SUP', name: 'Base Supplier' }),
  land: await Land.create({ code: 'BASE-LAND', name: 'Base Land' }),
  product: await Product.create({ code: 'BASE-PRD', name: 'Base Product' }),
  otherProduct: await Product.create({ code: 'BASE-PRD-2', name: 'Other Product' }),
});

// items: [{ productId, quantity, price }]
const createTicket = async ({ code, date, supplierId, landId, items }) => {
  const ticket = await Ticket.create({ code, date, supplierId, landId });
  await TicketItem.bulkCreate(items.map((item) => ({ ...item, ticketId: ticket.id })));
  return ticket;
};

module.exports = { createBase, createTicket };
