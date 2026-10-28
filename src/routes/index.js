const { Router } = require('express');
const supplierRoutes = require('./supplier.routes');
const landRoutes = require('./land.routes');

const router = Router();

router.use('/suppliers', supplierRoutes);
router.use('/lands', landRoutes);

module.exports = router;
