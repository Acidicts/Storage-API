const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

// POST /api/images - Store a new image
router.post('/images', imageController.postImage);

// GET /api/images - List all stored images
router.get('/images', imageController.getAllImages);

// GET /api/images/:id - Retrieve a specific image
router.get('/images/:id', imageController.getImage);

// DELETE /api/images/:id - Delete a specific image
router.delete('/images/:id', imageController.deleteImage);

// TEST /api/test-storage - Test storage functionality
router.get('/test-storage', imageController.testStorage);

module.exports = router;