const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// GET /api/product-categories - Get all product categories
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Пока возвращаем моковые данные, так как таблица категорий еще не создана
    const categories = [
      { id: 1, name: 'Веб-приложения', status: 'active' },
      { id: 2, name: 'Мобильные приложения', status: 'active' },
      { id: 3, name: 'API', status: 'active' },
      { id: 4, name: 'Интеграции', status: 'active' },
      { id: 5, name: 'Аналитика', status: 'active' },
      { id: 6, name: 'Архивные проекты', status: 'archived' },
    ];

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error getting product categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/product-categories/:id - Get specific product category
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Пока возвращаем моковые данные
    const categories = [
      { id: 1, name: 'Веб-приложения', status: 'active' },
      { id: 2, name: 'Мобильные приложения', status: 'active' },
      { id: 3, name: 'API', status: 'active' },
      { id: 4, name: 'Интеграции', status: 'active' },
      { id: 5, name: 'Аналитика', status: 'active' },
      { id: 6, name: 'Архивные проекты', status: 'archived' },
    ];

    const category = categories.find(cat => cat.id === parseInt(id));
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Error getting product category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/product-categories - Create new product category
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, status = 'active' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Пока возвращаем моковый ответ
    const newCategory = {
      id: Date.now(),
      name: name.trim(),
      status
    };

    res.status(201).json({
      success: true,
      category: newCategory
    });
  } catch (error) {
    console.error('Error creating product category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/product-categories/:id - Update product category
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Пока возвращаем моковый ответ
    const updatedCategory = {
      id: parseInt(id),
      name: name.trim(),
      status: status || 'active'
    };

    res.json({
      success: true,
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error updating product category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/product-categories/:id - Delete product category
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Пока возвращаем моковый ответ
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 