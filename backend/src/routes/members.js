// src/routes/members.js
const express = require('express');
const router = express.Router();
const { memberController } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', memberController.getMembers);
router.post('/invite', memberController.inviteMember);
router.delete('/:userId', memberController.removeMember);

module.exports = router;
