const express = require('express');
const router = express.Router();
const {
  getSchools,
  createSchool,
  updateSchool,
  deleteSchool,
  getStudents,
  createStudent
} = require('../controllers/workController');

router.get('/schools', getSchools);
router.post('/schools', createSchool);
router.put('/schools/:id', updateSchool);
router.delete('/schools/:id', deleteSchool);

router.get('/students', getStudents);
router.post('/students', createStudent);

module.exports = router;
