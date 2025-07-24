const express = require('express');
const router = express.Router();
const { Product, ProductType } = require('../models');
const { Op } = require('sequelize');

// Получить все продукты (публичный доступ)
router.get('/', async (req, res) => {
  try {
    
    const { 
      page = 1, 
      limit = 50,
      status, 
      search, 
      sortBy = 'name',
      sortOrder = 'ASC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const order = [[sortBy, sortOrder.toUpperCase()]];

    let where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { short_description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Для публичных запросов показываем только активные продукты
    if (!req.employee) {
      where.status = 'active';
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: ProductType,
          as: 'productType',
          attributes: ['id', 'name', 'color']
        }
      ],
      order,
      offset,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Получить конкретный продукт
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id, {
      include: [
        {
          model: ProductType,
          as: 'productType',
          attributes: ['id', 'name', 'color']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Для неавторизованных пользователей скрываем неактивные продукты
    if (!req.employee && product.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Создать продукт (только для авторизованных)
router.post('/', async (req, res) => {
  try {
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, short_description, long_description, status, product_type_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const product = await Product.create({
      name,
      short_description,
      long_description,
      status: status || 'active',
      product_type_id
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Обновить продукт (только для авторизованных)
router.put('/:id', async (req, res) => {
  try {
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { name, short_description, long_description, status, product_type_id } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.update({
      name: name || product.name,
      short_description: short_description !== undefined ? short_description : product.short_description,
      long_description: long_description !== undefined ? long_description : product.long_description,
      status: status || product.status,
      product_type_id: product_type_id || product.product_type_id
    });

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Удалить продукт (только для авторизованных)
router.delete('/:id', async (req, res) => {
  try {
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.destroy();
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router; 