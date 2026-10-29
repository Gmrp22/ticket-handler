const { describe, test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { startApi, resetData, models } = require('../helpers/api');
const { createTicket } = require('../helpers/fixtures');

const { Supplier, Land, Product } = models;

describe('GET /api/payments', () => {
  let api;

  before(async () => {
    api = await startApi();
  });
  after(() => api.stop());

  beforeEach(async () => {
    await resetData();
    // Beta is created first, so its id is lower than the id of Alpha. This way the order by name
    // is not the same as the order by id
    const beta = await Supplier.create({ code: 'SUP-B', name: 'Beta Co' });
    const alpha = await Supplier.create({ code: 'SUP-A', name: 'Alpha Co' });
    const land = await Land.create({ code: 'LAND', name: 'Land' });
    const product = await Product.create({ code: 'PRD', name: 'Product' });

    // items: [[quantity, price], ...]
    const ticket = (code, date, supplier, items) =>
      createTicket({
        code,
        date,
        supplierId: supplier.id,
        landId: land.id,
        items: items.map(([quantity, price]) => ({ productId: product.id, quantity, price })),
      });

    // ISO week 3 of 2023 goes from Monday 2023-01-16 to Sunday 2023-01-22
    await ticket('T-1', '2023-01-17', beta, [
      [10, 1.5],
      [2, 0.333],
    ]); // 15.666
    await ticket('T-2', '2023-01-16', alpha, [[100, 0.7]]); // 70.000
    await ticket('T-3', '2023-01-20', alpha, [[0, 5]]); // 0.000: a line with quantity 0
    await ticket('T-4', '2023-01-15', alpha, [[50, 1]]); // Sunday before: week 2
    await ticket('T-5', '2023-01-23', beta, [[1, 1]]); // Monday after: week 4
    // The ISO year is not always the year of the date
    await ticket('T-6', '2024-12-30', alpha, [[1, 10]]); // week 1 of 2025
    await ticket('T-7', '2023-01-01', alpha, [[1, 20]]); // week 52 of 2022
  });

  // Only the fields that matter in each test
  const summary = (body) =>
    body.suppliers.map((item) => ({
      supplier: item.supplier.name,
      total: item.total,
      tickets: item.tickets.map((ticket) => `${ticket.code} ${ticket.total}`),
    }));

  test('groups the tickets of the week by supplier and adds the totals', async () => {
    const { status, body } = await api.call('GET', '/api/payments?year=2023&week=3');

    assert.equal(status, 200);
    assert.equal(body.year, 2023);
    assert.equal(body.week, 3);
    assert.equal(body.total, '85.666');
    assert.deepEqual(summary(body), [
      { supplier: 'Alpha Co', total: '70.000', tickets: ['T-2 70.000', 'T-3 0.000'] },
      { supplier: 'Beta Co', total: '15.666', tickets: ['T-1 15.666'] },
    ]);
  });

  test('uses the days of the ISO week: from Monday to Sunday', async () => {
    const { body } = await api.call('GET', '/api/payments?year=2023&week=3');

    const codes = body.suppliers.flatMap((item) => item.tickets.map((ticket) => ticket.code));
    assert.ok(!codes.includes('T-4'), 'Sunday 15 is the week before');
    assert.ok(!codes.includes('T-5'), 'Monday 23 is the week after');
  });

  test('includes a ticket with all its items in quantity 0, with total 0', async () => {
    const { body } = await api.call('GET', '/api/payments?year=2023&week=3');

    const alpha = body.suppliers.find((item) => item.supplier.name === 'Alpha Co');
    assert.deepEqual(alpha.tickets[1], {
      id: alpha.tickets[1].id,
      code: 'T-3',
      date: '2023-01-20',
      total: '0.000',
    });
  });

  test('orders the tickets of each supplier by date', async () => {
    const { body } = await api.call('GET', '/api/payments?year=2023&week=3');

    const alpha = body.suppliers.find((item) => item.supplier.name === 'Alpha Co');
    assert.deepEqual(
      alpha.tickets.map((ticket) => ticket.date),
      ['2023-01-16', '2023-01-20'],
    );
  });

  test('orders the suppliers by name, and by the sort and order of the URL', async () => {
    const byName = await api.call('GET', '/api/payments?year=2023&week=3');
    const byNameDesc = await api.call('GET', '/api/payments?year=2023&week=3&order=desc');
    const byCodeDesc = await api.call('GET', '/api/payments?year=2023&week=3&sort=code&order=desc');

    assert.deepEqual(
      byName.body.suppliers.map((item) => item.supplier.name),
      ['Alpha Co', 'Beta Co'],
    );
    assert.deepEqual(
      byNameDesc.body.suppliers.map((item) => item.supplier.name),
      ['Beta Co', 'Alpha Co'],
    );
    assert.deepEqual(
      byCodeDesc.body.suppliers.map((item) => item.supplier.code),
      ['SUP-B', 'SUP-A'],
    );
  });

  test('finds a date by its ISO year, not by the year of the date', async () => {
    const week1of2025 = await api.call('GET', '/api/payments?year=2025&week=1');
    const week1of2024 = await api.call('GET', '/api/payments?year=2024&week=1');
    const week52of2022 = await api.call('GET', '/api/payments?year=2022&week=52');
    const week1of2023 = await api.call('GET', '/api/payments?year=2023&week=1');

    assert.deepEqual(summary(week1of2025.body), [
      { supplier: 'Alpha Co', total: '10.000', tickets: ['T-6 10.000'] },
    ]);
    assert.deepEqual(week1of2024.body.suppliers, [], '2024-12-30 is not in week 1 of 2024');
    assert.deepEqual(summary(week52of2022.body), [
      { supplier: 'Alpha Co', total: '20.000', tickets: ['T-7 20.000'] },
    ]);
    assert.deepEqual(week1of2023.body.suppliers, [], '2023-01-01 is not in week 1 of 2023');
  });

  test('answers 200 with an empty list when the week has no tickets', async () => {
    const { status, body } = await api.call('GET', '/api/payments?year=2023&week=10');

    assert.equal(status, 200);
    assert.deepEqual(body, { year: 2023, week: 10, total: '0.000', suppliers: [] });
  });

  test('answers 400 for week 53 in a year that only has 52 weeks', async () => {
    const without = await api.call('GET', '/api/payments?year=2022&week=53');
    const withIt = await api.call('GET', '/api/payments?year=2020&week=53');

    assert.equal(without.status, 400);
    assert.deepEqual(without.body.error, ['week: the year 2022 only has 52 weeks']);
    assert.equal(withIt.status, 200);
  });

  test('answers 400 when the year or the week are missing or wrong', async () => {
    const missing = await api.call('GET', '/api/payments');
    const week = await api.call('GET', '/api/payments?year=2023&week=99');
    const order = await api.call('GET', '/api/payments?year=2023&week=3&order=up');

    assert.equal(missing.status, 400);
    assert.deepEqual(missing.body.error, ['year: is required', 'week: is required']);
    assert.equal(week.status, 400);
    assert.deepEqual(week.body.error, ['week: must be between 1 and 53']);
    assert.equal(order.status, 400);
    assert.deepEqual(order.body.error, ['order: must be one of: asc, desc']);
  });
});
