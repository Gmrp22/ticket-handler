const { Router } = require('express');
const landController = require('../controllers/land.controller');

const router = Router();

router.get('/', landController.getAll);
router.get('/:id', landController.getById);
router.post('/', landController.create);
router.put('/:id', landController.update);
router.delete('/:id', landController.remove);

module.exports = router;
