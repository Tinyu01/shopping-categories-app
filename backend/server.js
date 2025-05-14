const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const sequelize = require('./db');
const Category = require('./models/category');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"]
    }
  }
}));

// Middleware
app.use(morgan('dev')); // Logging
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes prefix
const API_PREFIX = '/api';

// Initialize database
async function initializeDatabase() {
  try {
    // Sync all models with the database
    await sequelize.sync();
    console.log('Database synchronized successfully');
    
    // Check if we need to seed initial categories
    const count = await Category.count();
    if (count === 0) {
      console.log('Seeding initial categories...');
      await seedInitialCategories();
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Seed initial categories
async function seedInitialCategories() {
  try {
    // Create top-level categories
    const food = await Category.create({ 
      name: 'Food Items', 
      description: 'All food-related categories' 
    });
    
    const electronics = await Category.create({ 
      name: 'Electronics Items', 
      description: 'All electronics-related categories'
    });
    
    // Create subcategories for Food
    const fruits = await Category.create({ 
      name: 'Fruits', 
      parentId: food.id, 
      description: 'Fresh fruits from around the world'
    });
    
    const vegetables = await Category.create({ 
      name: 'Vegetables', 
      parentId: food.id,
      description: 'Fresh and nutritious vegetables'
    });
    
    const dairy = await Category.create({ 
      name: 'Dairy', 
      parentId: food.id,
      description: 'Milk, cheese, and other dairy products'
    });
    
    // Create subcategories for Electronics
    const computers = await Category.create({ 
      name: 'Computers', 
      parentId: electronics.id,
      description: 'Desktops, laptops, and accessories'
    });
    
    const smartphones = await Category.create({ 
      name: 'Smartphones', 
      parentId: electronics.id,
      description: 'Mobile phones and accessories'
    });
    
    const televisions = await Category.create({ 
      name: 'Televisions', 
      parentId: electronics.id,
      description: 'Smart TVs, OLED, LCD, and more'
    });
    
    // Create deeper nested categories
    await Category.create({ 
      name: 'Apples', 
      parentId: fruits.id,
      description: 'Various types of apples: Gala, Fuji, Granny Smith, and more'
    });
    
    await Category.create({ 
      name: 'Bananas', 
      parentId: fruits.id,
      description: 'Yellow, sweet, and nutritious'
    });
    
    await Category.create({ 
      name: 'Laptops', 
      parentId: computers.id,
      description: 'Portable computers for work and play'
    });
    
    await Category.create({ 
      name: 'Gaming PCs', 
      parentId: computers.id,
      description: 'High-performance computers for gaming enthusiasts'
    });
    
    console.log('Initial categories seeded successfully');
  } catch (error) {
    console.error('Failed to seed initial categories:', error);
  }
}

// API Routes

// Get all categories
app.get(`${API_PREFIX}/categories`, async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get a specific category by ID
app.get(`${API_PREFIX}/categories/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create a new category
app.post(`${API_PREFIX}/categories`, async (req, res) => {
  try {
    const { name, parentId, description } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Create the new category
    const category = await Category.create({
      name,
      parentId: parentId || null,
      description: description || null
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update a category
app.put(`${API_PREFIX}/categories/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId, description } = req.body;
    
    // Find the category to update
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Prevent circular references
    if (parentId && parentId === id) {
      return res.status(400).json({ error: 'Category cannot be its own parent' });
    }
    
    // Check if the new parent is not a child of this category (prevent circular references)
    if (parentId) {
      const isChild = await isDescendant(id, parentId);
      if (isChild) {
        return res.status(400).json({ 
          error: 'Cannot set a child category as parent (circular reference)'
        });
      }
    }
    
    // Update the category
    await category.update({
      name,
      parentId: parentId || null,
      description: description || null
    });
    
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete a category
app.delete(`${API_PREFIX}/categories/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if category has children
    const childrenCount = await Category.count({ where: { parentId: id } });
    
    if (childrenCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete a category that has subcategories' 
      });
    }
    
    // Delete the category
    await category.destroy();
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Check if potentialParentId is a descendant of categoryId
async function isDescendant(categoryId, potentialParentId) {
  let currentId = potentialParentId;
  
  while (currentId) {
    if (currentId === categoryId) {
      return true;
    }
    
    const current = await Category.findByPk(currentId);
    if (!current || !current.parentId) {
      return false;
    }
    
    currentId = current.parentId;
  }
  
  return false;
}

// Serve the frontend for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

module.exports = app;