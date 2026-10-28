const { Router } = require('express');
const supplierRoutes = require('./supplier.routes');
const landRoutes = require('./land.routes');
const productRoutes = require('./product.routes');

const router = Router();

router.use('/suppliers', supplierRoutes);
router.use('/lands', landRoutes);
router.use('/products', productRoutes);

module.exports = router;
