const { Router } = require('express');
const ticketController = require('../controllers/ticket.controller');

const router = Router();

router.get('/', ticketController.getAll);
router.get('/:id', ticketController.getById);
router.post('/', ticketController.create);
router.put('/:id', ticketController.update);
router.delete('/:id', ticketController.remove);

module.exports = router;
