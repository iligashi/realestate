const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getFavorites,
  addFavorite,
  updateFavorite,
  removeFavorite,
  removeFavoriteByProperty
} = require('../controllers/favoriteController');

router.use(auth);

router.get('/', getFavorites);
router.post('/', addFavorite);
router.patch('/:favoriteId', updateFavorite);
router.delete('/:favoriteId', removeFavorite);
router.delete('/property/:propertyId', removeFavoriteByProperty);

module.exports = router;
