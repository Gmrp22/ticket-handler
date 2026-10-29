const { Land } = require('../../src/models');
const { catalogTests } = require('../helpers/catalog-tests');
const { createBase, createTicket } = require('../helpers/fixtures');

catalogTests({
  path: '/api/lands',
  label: 'Lands',
  model: Land,
  createUsage: async (land) => {
    const { supplier, product } = await createBase();
    await createTicket({
      code: 'T-1',
      date: '2023-01-16',
      supplierId: supplier.id,
      landId: land.id,
      items: [{ productId: product.id, quantity: 1, price: 1 }],
    });
  },
});
