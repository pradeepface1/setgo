const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logisticsController');
const auth = require('../middleware/auth');

router.post('/trips', auth.authenticate, logisticsController.createTrip);
router.get('/trips', auth.authenticate, logisticsController.getTrips);
router.put('/trips/:id', auth.authenticate, logisticsController.updateTrip);
router.post('/trips/:id/transaction', auth.authenticate, logisticsController.addTransaction);

module.exports = router;
