const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { idParamsSchema } = require('../../src/schemas/common.schema');
const { catalogSchema, catalogListQuerySchema } = require('../../src/schemas/catalog.schema');
const { ticketSchema, ticketListQuerySchema } = require('../../src/schemas/ticket.schema');
const { paymentQuerySchema, weeksInIsoYear } = require('../../src/schemas/payment.schema');

// The messages as the client sees them: "field: message"
const errorsOf = (schema, data) => {
  const result = schema.safeParse(data);
  assert.equal(result.success, false, 'it should be invalid');
  return result.error.issues.map((issue) =>
    [issue.path.join('.'), issue.message].filter(Boolean).join(': '),
  );
};

const validTicket = {
  code: '1234567',
  date: '2023-03-01',
  supplierId: 1,
  landId: 1,
  items: [{ productId: 1, quantity: 100, price: 0.7 }],
};

describe('idParamsSchema', () => {
  test('accepts a number written as text', () => {
    assert.deepEqual(idParamsSchema.parse({ id: '5' }), { id: 5 });
  });

  test('rejects what is not a whole number greater than 0', () => {
    assert.deepEqual(errorsOf(idParamsSchema, { id: 'abc' }), ['id: must be a whole number']);
    assert.deepEqual(errorsOf(idParamsSchema, { id: '1.5' }), ['id: must be a whole number']);
    assert.deepEqual(errorsOf(idParamsSchema, { id: '0' }), ['id: must be greater than 0']);
  });
});

describe('catalogSchema (suppliers, lands and products)', () => {
  test('accepts code and name, and trims the spaces', () => {
    assert.deepEqual(catalogSchema.parse({ code: ' SUP1 ', name: ' Name ' }), {
      code: 'SUP1',
      name: 'Name',
    });
  });

  test('ignores the fields that are not part of the body', () => {
    const data = catalogSchema.parse({ code: 'A', name: 'B', id: 99, admin: true });

    assert.deepEqual(data, { code: 'A', name: 'B' });
  });

  test('says which field is missing, empty or has the wrong type', () => {
    assert.deepEqual(errorsOf(catalogSchema, {}), ['code: is required', 'name: is required']);
    assert.deepEqual(errorsOf(catalogSchema, { code: 'A', name: '   ' }), [
      'name: cannot be empty',
    ]);
    assert.deepEqual(errorsOf(catalogSchema, { code: 5, name: 'B' }), ['code: must be a text']);
  });

  test('rejects a body that is not an object', () => {
    assert.deepEqual(errorsOf(catalogSchema, undefined), ['the body must be a JSON object']);
  });
});

describe('catalogListQuerySchema', () => {
  test('sorts by id ascending when there is nothing in the URL', () => {
    assert.deepEqual(catalogListQuerySchema.parse({}), { sort: 'id', order: 'asc' });
  });

  test('accepts the allowed fields and rejects the others', () => {
    assert.deepEqual(catalogListQuerySchema.parse({ sort: 'name', order: 'desc' }), {
      sort: 'name',
      order: 'desc',
    });
    assert.deepEqual(errorsOf(catalogListQuerySchema, { sort: 'password' }), [
      'sort: must be one of: id, code, name',
    ]);
    assert.deepEqual(errorsOf(catalogListQuerySchema, { order: 'up' }), [
      'order: must be one of: asc, desc',
    ]);
  });
});

describe('ticketSchema', () => {
  test('accepts a valid ticket', () => {
    assert.deepEqual(ticketSchema.parse(validTicket), validTicket);
  });

  test('accepts an item with quantity 0, the Excel has them', () => {
    const ticket = { ...validTicket, items: [{ productId: 1, quantity: 0, price: 2 }] };

    assert.doesNotThrow(() => ticketSchema.parse(ticket));
  });

  test('rejects a date that does not exist', () => {
    const errors = errorsOf(ticketSchema, { ...validTicket, date: '2023-02-30' });

    assert.deepEqual(errors, ['date: must be a valid date in the format YYYY-MM-DD']);
  });

  test('needs at least one item, and a list', () => {
    assert.deepEqual(errorsOf(ticketSchema, { ...validTicket, items: [] }), [
      'items: must have at least one item',
    ]);
    assert.deepEqual(errorsOf(ticketSchema, { ...validTicket, items: 'no' }), [
      'items: must be a list',
    ]);
  });

  test('points to the exact field of the item that is wrong', () => {
    const items = [
      { productId: 1, quantity: 1, price: 1 },
      { quantity: -1, price: 'x' },
    ];

    assert.deepEqual(errorsOf(ticketSchema, { ...validTicket, items }), [
      'items.1.productId: is required',
      'items.1.quantity: cannot be negative',
      'items.1.price: must be a number',
    ]);
  });

  test('rejects ids that are not whole numbers greater than 0', () => {
    const errors = errorsOf(ticketSchema, { ...validTicket, supplierId: '1', landId: 0 });

    assert.deepEqual(errors, [
      'supplierId: must be a whole number',
      'landId: must be greater than 0',
    ]);
  });
});

describe('ticketListQuerySchema', () => {
  test('uses the defaults when there is nothing in the URL', () => {
    assert.deepEqual(ticketListQuerySchema.parse({}), {
      page: 1,
      limit: 20,
      sort: 'date',
      order: 'desc',
    });
  });

  test('converts the numbers that come as text', () => {
    const query = ticketListQuerySchema.parse({
      page: '2',
      limit: '50',
      sort: 'code',
      order: 'asc',
    });

    assert.deepEqual(query, { page: 2, limit: 50, sort: 'code', order: 'asc' });
  });

  test('rejects a limit over 100, a page under 1 and a sort that is not allowed', () => {
    assert.deepEqual(errorsOf(ticketListQuerySchema, { limit: '500' }), [
      'limit: must be 100 or less',
    ]);
    assert.deepEqual(errorsOf(ticketListQuerySchema, { page: '0' }), ['page: must be 1 or more']);
    assert.deepEqual(errorsOf(ticketListQuerySchema, { page: 'abc' }), ['page: must be a number']);
    assert.deepEqual(errorsOf(ticketListQuerySchema, { sort: 'password' }), [
      'sort: must be one of: date, code, id',
    ]);
    assert.deepEqual(errorsOf(ticketListQuerySchema, { order: 'up' }), [
      'order: must be one of: asc, desc',
    ]);
  });
});

describe('paymentQuerySchema', () => {
  test('needs year and week, and sorts by name ascending by default', () => {
    assert.deepEqual(paymentQuerySchema.parse({ year: '2023', week: '3' }), {
      year: 2023,
      week: 3,
      sort: 'name',
      order: 'asc',
    });
  });

  test('says which one is missing', () => {
    assert.deepEqual(errorsOf(paymentQuerySchema, {}), ['year: is required', 'week: is required']);
    assert.deepEqual(errorsOf(paymentQuerySchema, { year: '2023' }), ['week: is required']);
  });

  test('keeps the week between 1 and 53 and the year between 1900 and 2100', () => {
    assert.deepEqual(errorsOf(paymentQuerySchema, { year: '2023', week: '0' }), [
      'week: must be between 1 and 53',
    ]);
    assert.deepEqual(errorsOf(paymentQuerySchema, { year: '2023', week: '54' }), [
      'week: must be between 1 and 53',
    ]);
    assert.deepEqual(errorsOf(paymentQuerySchema, { year: '1800', week: '3' }), [
      'year: must be between 1900 and 2100',
    ]);
  });

  test('knows which years have 53 weeks', () => {
    const with53 = [2004, 2009, 2015, 2020, 2026, 2032, 2037];

    for (let year = 2000; year <= 2040; year++) {
      assert.equal(weeksInIsoYear(year), with53.includes(year) ? 53 : 52, String(year));
    }
  });

  test('rejects week 53 in a year that only has 52 weeks', () => {
    assert.deepEqual(errorsOf(paymentQuerySchema, { year: '2022', week: '53' }), [
      'week: the year 2022 only has 52 weeks',
    ]);
    assert.deepEqual(errorsOf(paymentQuerySchema, { year: '2023', week: '53' }), [
      'week: the year 2023 only has 52 weeks',
    ]);
    assert.doesNotThrow(() => paymentQuerySchema.parse({ year: '2022', week: '52' }));
  });

  test('accepts week 53 in a year that has it', () => {
    assert.doesNotThrow(() => paymentQuerySchema.parse({ year: '2020', week: '53' }));
    assert.doesNotThrow(() => paymentQuerySchema.parse({ year: '2026', week: '53' }));
  });

  test('accepts week 53 and the sort by code', () => {
    const query = paymentQuerySchema.parse({
      year: '2020',
      week: '53',
      sort: 'code',
      order: 'desc',
    });

    assert.deepEqual(query, { year: 2020, week: 53, sort: 'code', order: 'desc' });
  });
});
