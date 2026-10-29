const { describe, test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { startApi, resetData } = require('./api');

// The same tests for suppliers, lands and products, because the three resources work the same.
// createUsage(item) creates a ticket that uses the item, so it cannot be deleted
const catalogTests = ({ path, label, model, createUsage }) => {
  describe(label, () => {
    let api;

    before(async () => {
      api = await startApi();
    });
    after(() => api.stop());
    beforeEach(resetData);

    const create = (code, name = 'Name') => model.create({ code, name });

    describe(`GET ${path}`, () => {
      test('lists everything ordered by id', async () => {
        await create('C-2');
        await create('C-1');

        const { status, body } = await api.call('GET', path);

        assert.equal(status, 200);
        assert.deepEqual(
          body.map((item) => item.code),
          ['C-2', 'C-1'],
        );
      });

      test('sorts by the field and the order of the URL, they are optional', async () => {
        await create('C-1', 'Bravo');
        await create('C-2', 'Alpha');
        await create('C-3', 'Charlie');
        const codes = async (query) =>
          (await api.call('GET', `${path}${query}`)).body.map((item) => item.code);

        assert.deepEqual(await codes('?sort=name'), ['C-2', 'C-1', 'C-3']);
        assert.deepEqual(await codes('?sort=name&order=desc'), ['C-3', 'C-1', 'C-2']);
        assert.deepEqual(await codes('?sort=code&order=desc'), ['C-3', 'C-2', 'C-1']);
        assert.deepEqual(await codes('?order=desc'), ['C-3', 'C-2', 'C-1']);
        assert.deepEqual(await codes(''), ['C-1', 'C-2', 'C-3']);
      });

      test('answers 400 for a sort or an order that is not allowed', async () => {
        const sort = await api.call('GET', `${path}?sort=password`);
        const order = await api.call('GET', `${path}?order=up`);

        assert.equal(sort.status, 400);
        assert.deepEqual(sort.body.error, ['sort: must be one of: id, code, name']);
        assert.equal(order.status, 400);
        assert.deepEqual(order.body.error, ['order: must be one of: asc, desc']);
      });

      test('answers an empty list when there is nothing', async () => {
        const { status, body } = await api.call('GET', path);

        assert.equal(status, 200);
        assert.deepEqual(body, []);
      });
    });

    describe(`GET ${path}/:id`, () => {
      test('answers the object with its fields in camelCase', async () => {
        const item = await create('C-1', 'First');

        const { status, body } = await api.call('GET', `${path}/${item.id}`);

        assert.equal(status, 200);
        assert.deepEqual(Object.keys(body).sort(), [
          'code',
          'createdAt',
          'id',
          'name',
          'updatedAt',
        ]);
        assert.equal(body.code, 'C-1');
        assert.equal(body.name, 'First');
      });

      test('answers 404 when it does not exist', async () => {
        const { status, body } = await api.call('GET', `${path}/999999`);

        assert.equal(status, 404);
        assert.match(body.error, /not found/);
      });

      test('answers 400 when the id is not a number', async () => {
        const { status, body } = await api.call('GET', `${path}/abc`);

        assert.equal(status, 400);
        assert.deepEqual(body.error, ['id: must be a whole number']);
      });
    });

    describe(`POST ${path}`, () => {
      test('creates it, without the spaces around the text', async () => {
        const { status, body } = await api.call('POST', path, { code: ' N-1 ', name: ' New ' });

        assert.equal(status, 201);
        assert.equal(body.code, 'N-1');
        assert.equal(body.name, 'New');
        assert.equal(await model.count(), 1);
      });

      test('answers 409 when the code already exists', async () => {
        await create('C-1');

        const { status, body } = await api.call('POST', path, { code: 'C-1', name: 'Other' });

        assert.equal(status, 409);
        assert.match(body.error, /code already exists/);
        assert.equal(await model.count(), 1);
      });

      test('answers 400 with the fields that are wrong', async () => {
        const { status, body } = await api.call('POST', path, { name: '   ' });

        assert.equal(status, 400);
        assert.deepEqual(body.error, ['code: is required', 'name: cannot be empty']);
        assert.equal(await model.count(), 0);
      });
    });

    describe(`PUT ${path}/:id`, () => {
      test('updates it', async () => {
        const item = await create('C-1', 'Old');

        const { status, body } = await api.call('PUT', `${path}/${item.id}`, {
          code: 'C-1',
          name: 'New name',
        });

        assert.equal(status, 200);
        assert.equal(body.name, 'New name');
        assert.equal((await model.findByPk(item.id)).name, 'New name');
      });

      test('answers 404 when it does not exist', async () => {
        const { status } = await api.call('PUT', `${path}/999999`, { code: 'X', name: 'X' });

        assert.equal(status, 404);
      });

      test('answers 409 when the code belongs to another one', async () => {
        await create('C-1');
        const second = await create('C-2');

        const { status } = await api.call('PUT', `${path}/${second.id}`, {
          code: 'C-1',
          name: 'Name',
        });

        assert.equal(status, 409);
        assert.equal((await model.findByPk(second.id)).code, 'C-2');
      });

      test('answers 400 when the data is wrong, and changes nothing', async () => {
        const item = await create('C-1', 'Old');

        const { status } = await api.call('PUT', `${path}/${item.id}`, { code: 'C-1' });

        assert.equal(status, 400);
        assert.equal((await model.findByPk(item.id)).name, 'Old');
      });
    });

    describe(`DELETE ${path}/:id`, () => {
      test('deletes it and answers 204 without body', async () => {
        const item = await create('C-1');

        const { status, body } = await api.call('DELETE', `${path}/${item.id}`);

        assert.equal(status, 204);
        assert.equal(body, null);
        assert.equal(await model.count(), 0);
      });

      test('answers 404 when it does not exist', async () => {
        const { status } = await api.call('DELETE', `${path}/999999`);

        assert.equal(status, 404);
      });

      test('answers 409 when a ticket uses it, and it is not deleted', async () => {
        const item = await create('C-1');
        await createUsage(item);

        const { status, body } = await api.call('DELETE', `${path}/${item.id}`);

        assert.equal(status, 409);
        assert.match(body.error, /cannot be deleted/);
        assert.ok(await model.findByPk(item.id));
      });
    });
  });
};

module.exports = { catalogTests };
