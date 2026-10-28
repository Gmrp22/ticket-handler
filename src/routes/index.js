const { Router } = require('express');
const supplierRoutes = require('./supplier.routes');

const router = Router();

router.use('/suppliers', supplierRoutes);

module.exports = router;
