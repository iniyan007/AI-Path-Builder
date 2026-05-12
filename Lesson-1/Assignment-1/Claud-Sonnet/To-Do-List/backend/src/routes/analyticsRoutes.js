const express = require('express');
const router = express.Router();
const { getOverview, getProductivity, getTeamStats } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/overview', getOverview);
router.get('/productivity', getProductivity);
router.get('/team', getTeamStats);

module.exports = router;
