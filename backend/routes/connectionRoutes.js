
const express = require('express');
const router = express.Router();
const { getAllConnections } = require('../controllers/connectionController');

router.get('/', getAllConnections);

module.exports = router;
