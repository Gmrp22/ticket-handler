const { describe, test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { startApi, resetData, models } = require('../helpers/api');
const { createBase, createTicket } = require('../helpers/fixtures');

const { Ticket, TicketItem } = models;

describe('Tickets', () => {
  let api;
  let base;

  before(async () => {
    api = await startApi();
  });
  after(() => api.stop());
  beforeEach(async () => {
    await resetData();
    base = await createBase();
  });

  // The body of a valid ticket. Its total is 100 x 0.7 + 50 x 1.25 + 0 x 3 = 132.500
  const ticketBody = (overrides = {}) => ({
    code: 'T-100',
    date: '2023-03-01',
    supplierId: base.supplier.id,
    landId: base.land.id,
    items: [
      { productId: base.product.id, quantity: 100, price: 0.7 },
      { productId: base.product.id, quantity: 50, price: 1.25 },
      { productId: base.otherProduct.id, quantity: 0, price: 3 },
    ],
    ...overrides,
  });

  // A ticket saved in the database, with one item. Its total is 10 x 2 = 20.000
  const existingTicket = (code, date = '2023-01-16') =>
    createTicket({
      code,
      date,
      supplierId: base.supplier.id,
      landId: base.land.id,
      items: [{ productId: base.product.id, quantity: 10, price: 2 }],
    });

  describe('GET /api/tickets', () => {
    test('lists the tickets, the most recent first, with supplier, land and total', async () => {
      await existingTicket('T-1', '2023-01-10');
      await existingTicket('T-3', '2023-01-30');
      await existingTicket('T-2', '2023-01-20');

      const { status, body } = await api.call('GET', '/api/tickets');

      assert.equal(status, 200);
      assert.deepEqual(
        body.data.map((ticket) => ticket.code),
        ['T-3', 'T-2', 'T-1'],
      );
      const [first] = body.data;
      assert.equal(first.total, '20.000');
      assert.equal(first.supplier.name, 'Base Supplier');
      assert.equal(first.land.name, 'Base Land');
      assert.equal(first.items, undefined, 'the list does not include the items');
    });

    test('sorts by the field and the order of the URL', async () => {
      await existingTicket('T-2', '2023-01-20');
      await existingTicket('T-1', '2023-01-30');

      const { body } = await api.call('GET', '/api/tickets?sort=code&order=asc');

      assert.deepEqual(
        body.data.map((ticket) => ticket.code),
        ['T-1', 'T-2'],
      );
    });

    test('paginates', async () => {
      await existingTicket('T-1', '2023-01-10');
      await existingTicket('T-2', '2023-01-20');
      await existingTicket('T-3', '2023-01-30');

      const { body } = await api.call('GET', '/api/tickets?page=2&limit=2');

      assert.deepEqual(
        body.data.map((ticket) => ticket.code),
        ['T-1'],
      );
      assert.deepEqual(body.pagination, { page: 2, limit: 2, total: 3, totalPages: 2 });
    });

    test('answers 400 for a limit that is too big or a sort that is not allowed', async () => {
      const limit = await api.call('GET', '/api/tickets?limit=500');
      const sort = await api.call('GET', '/api/tickets?sort=password');

      assert.equal(limit.status, 400);
      assert.deepEqual(limit.body.error, ['limit: must be 100 or less']);
      assert.equal(sort.status, 400);
      assert.deepEqual(sort.body.error, ['sort: must be one of: date, code, id']);
    });
  });

  describe('GET /api/tickets/:id', () => {
    test('answers the ticket with its items and the product of each one', async () => {
      const ticket = await existingTicket('T-1');

      const { status, body } = await api.call('GET', `/api/tickets/${ticket.id}`);

      assert.equal(status, 200);
      assert.equal(body.code, 'T-1');
      assert.equal(body.date, '2023-01-16');
      assert.equal(body.supplierId, base.supplier.id);
      assert.equal(body.landId, base.land.id);
      assert.equal(body.total, '20.000');
      assert.equal(body.supplier.code, 'BASE-SUP');
      assert.equal(body.land.code, 'BASE-LAND');
      assert.equal(body.items.length, 1);
      assert.deepEqual(
        { ...body.items[0], id: undefined, createdAt: undefined, updatedAt: undefined },
        {
          id: undefined,
          ticketId: ticket.id,
          productId: base.product.id,
          quantity: '10.000',
          price: '2.000',
          createdAt: undefined,
          updatedAt: undefined,
          product: { id: base.product.id, code: 'BASE-PRD', name: 'Base Product' },
        },
      );
    });

    test('answers 404 when it does not exist', async () => {
      const { status, body } = await api.call('GET', '/api/tickets/999999');

      assert.equal(status, 404);
      assert.deepEqual(body, { status: 404, error: 'Ticket not found' });
    });

    test('answers 400 when the id is not a number', async () => {
      const { status } = await api.call('GET', '/api/tickets/abc');

      assert.equal(status, 400);
    });
  });

  describe('POST /api/tickets', () => {
    test('creates the ticket with its items and calculates the total', async () => {
      const { status, body } = await api.call('POST', '/api/tickets', ticketBody());

      assert.equal(status, 201);
      assert.equal(body.code, 'T-100');
      assert.equal(body.total, '132.500');
      assert.equal(body.items.length, 3);
      assert.equal(body.items[0].product.code, 'BASE-PRD');
      assert.equal(await Ticket.count(), 1);
      assert.equal(await TicketItem.count(), 3);
    });

    test('keeps the same product repeated in two items', async () => {
      const { body } = await api.call('POST', '/api/tickets', ticketBody());

      const repeated = body.items.filter((item) => item.productId === base.product.id);
      assert.equal(repeated.length, 2);
    });

    test('answers 409 when the code already exists', async () => {
      await existingTicket('T-100');

      const { status, body } = await api.call('POST', '/api/tickets', ticketBody());

      assert.equal(status, 409);
      assert.deepEqual(body, { status: 409, error: 'Ticket code already exists' });
    });

    test('answers 400 when the supplier, the land or a product does not exist, and saves nothing', async () => {
      const items = [
        { productId: base.product.id, quantity: 1, price: 1 },
        { productId: 999999, quantity: 1, price: 1 },
      ];

      const { status, body } = await api.call('POST', '/api/tickets', ticketBody({ items }));

      assert.equal(status, 400);
      assert.equal(body.error, 'Supplier, land or product does not exist');
      assert.equal(await Ticket.count(), 0, 'the transaction must be undone');
      assert.equal(await TicketItem.count(), 0);
    });

    test('answers 400 with the exact fields when the data is wrong', async () => {
      const { status, body } = await api.call(
        'POST',
        '/api/tickets',
        ticketBody({ date: '2023-02-30', items: [] }),
      );

      assert.equal(status, 400);
      assert.deepEqual(body.error, [
        'date: must be a valid date in the format YYYY-MM-DD',
        'items: must have at least one item',
      ]);
      assert.equal(await Ticket.count(), 0);
    });
  });

  describe('PUT /api/tickets/:id', () => {
    test('updates the ticket and replaces all its items', async () => {
      const ticket = await existingTicket('T-1');
      const update = ticketBody({
        code: 'T-1',
        date: '2023-04-01',
        items: [{ productId: base.otherProduct.id, quantity: 3, price: 4 }],
      });

      const { status, body } = await api.call('PUT', `/api/tickets/${ticket.id}`, update);

      assert.equal(status, 200);
      assert.equal(body.date, '2023-04-01');
      assert.equal(body.total, '12.000');
      assert.equal(body.items.length, 1);
      assert.equal(body.items[0].productId, base.otherProduct.id);
      assert.equal(await TicketItem.count(), 1, 'the old items must be deleted');
    });

    test('answers 404 when it does not exist', async () => {
      const { status } = await api.call('PUT', '/api/tickets/999999', ticketBody());

      assert.equal(status, 404);
    });

    test('answers 409 when the code belongs to another ticket', async () => {
      await existingTicket('T-1');
      const second = await existingTicket('T-2');

      const { status } = await api.call(
        'PUT',
        `/api/tickets/${second.id}`,
        ticketBody({ code: 'T-1' }),
      );

      assert.equal(status, 409);
      assert.equal((await Ticket.findByPk(second.id)).code, 'T-2');
    });

    test('answers 400 and changes nothing when the data is wrong', async () => {
      const ticket = await existingTicket('T-1');

      const { status } = await api.call(
        'PUT',
        `/api/tickets/${ticket.id}`,
        ticketBody({ code: 'T-1', items: [] }),
      );

      assert.equal(status, 400);
      assert.equal(await TicketItem.count({ where: { ticketId: ticket.id } }), 1);
    });

    test('keeps the old items when a product does not exist', async () => {
      const ticket = await existingTicket('T-1');
      const items = [{ productId: 999999, quantity: 1, price: 1 }];

      const { status } = await api.call(
        'PUT',
        `/api/tickets/${ticket.id}`,
        ticketBody({ code: 'T-1', items }),
      );

      assert.equal(status, 400);
      const saved = await TicketItem.findAll({ where: { ticketId: ticket.id } });
      assert.equal(saved.length, 1, 'the transaction must be undone');
      assert.equal(saved[0].productId, base.product.id);
    });
  });

  describe('DELETE /api/tickets/:id', () => {
    test('deletes the ticket and its items', async () => {
      const ticket = await existingTicket('T-1');

      const { status, body } = await api.call('DELETE', `/api/tickets/${ticket.id}`);

      assert.equal(status, 204);
      assert.equal(body, null);
      assert.equal(await Ticket.count(), 0);
      assert.equal(await TicketItem.count(), 0, 'the items are deleted with the ticket');
      assert.equal((await api.call('GET', `/api/tickets/${ticket.id}`)).status, 404);
    });

    test('answers 404 when it does not exist', async () => {
      const { status } = await api.call('DELETE', '/api/tickets/999999');

      assert.equal(status, 404);
    });
  });
});
