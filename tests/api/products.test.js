const { Product } = require('../../src/models');
const { catalogTests } = require('../helpers/catalog-tests');
const { createBase, createTicket } = require('../helpers/fixtures');

catalogTests({
  path: '/api/products',
  label: 'Products',
  model: Product,
  createUsage: async (product) => {
    const { supplier, land } = await createBase();
    await createTicket({
      code: 'T-1',
      date: '2023-01-16',
      supplierId: supplier.id,
      landId: land.id,
      items: [{ productId: product.id, quantity: 1, price: 1 }],
    });
  },
});
