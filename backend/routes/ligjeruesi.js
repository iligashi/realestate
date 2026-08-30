const express = require('express');
const router = express.Router();
const {
  getLigjeruesit,
  createLigjeruesi,
  updateLigjeruesi,
  deleteLigjeruesi,
  getLigjeratat,
  createLigjerata,
  deleteLigjerata
} = require('../controllers/ligjeruesiController');

router.get('/ligjeruesit', getLigjeruesit);
router.post('/ligjeruesit', createLigjeruesi);
router.put('/ligjeruesit/:id', updateLigjeruesi);
router.delete('/ligjeruesit/:id', deleteLigjeruesi);

router.get('/ligjeratat', getLigjeratat);
router.post('/ligjeratat', createLigjerata);
router.delete('/ligjeratat/:id', deleteLigjerata);

module.exports = router;
