const { Router } = require('express');
const paymentController = require('../controllers/payment.controller');

const router = Router();

router.get('/', paymentController.getWeekly);

module.exports = router;
