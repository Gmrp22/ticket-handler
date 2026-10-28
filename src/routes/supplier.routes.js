const { Router } = require('express');
const supplierController = require('../controllers/supplier.controller');

const router = Router();

router.get('/', supplierController.getAll);

module.exports = router;
