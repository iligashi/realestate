const express = require('express');
const router = express.Router();
const {
  getFabrikat,
  createFabrika,
  updateFabrika,
  deleteFabrika,
  getPunetoret,
  createPunetori,
  deletePunetori
} = require('../controllers/fabrikaController');

router.get('/fabrikat', getFabrikat);
router.post('/fabrikat', createFabrika);
router.put('/fabrikat/:id', updateFabrika);
router.delete('/fabrikat/:id', deleteFabrika);

router.get('/punetoret', getPunetoret);
router.post('/punetoret', createPunetori);
router.delete('/punetoret/:id', deletePunetori);

module.exports = router;
