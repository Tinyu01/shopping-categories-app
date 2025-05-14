const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class Category extends Model {}

Category.init({
  // Primary key
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  
  // Category name
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Category name cannot be empty'
      }
    }
  },
  
  // Optional description
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Virtual field to determine if category has children
  // This will be populated by the API when needed
  hasChildren: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('childrenCount') > 0;
    },
    set(value) {
      this.setDataValue('childrenCount', value ? 1 : 0);
    }
  }
}, {
  sequelize,
  modelName: 'Category',
  tableName: 'categories',
  timestamps: true,  // Add createdAt and updatedAt fields
  indexes: [
    {
      fields: ['parentId']  // Index for faster queries on parent-child relationships
    }
  ]
});

// Set up associations
Category.belongsTo(Category, { 
  as: 'parent', 
  foreignKey: 'parentId',
  onDelete: 'RESTRICT'  // Prevent deletion of parent if it has children
});

Category.hasMany(Category, { 
  as: 'children', 
  foreignKey: 'parentId'
});

// Instance methods

// Get full path of the category (e.g. "Food > Fruits > Apples")
Category.prototype.getFullPath = async function() {
  const path = [this.name];
  let currentParentId = this.parentId;
  
  while (currentParentId) {
    const parent = await Category.findByPk(currentParentId);
    if (!parent) break;
    
    path.unshift(parent.name);
    currentParentId = parent.parentId;
  }
  
  return path.join(' > ');
};

// Static methods

// Find all categories with their paths
Category.findAllWithPaths = async function() {
  const categories = await Category.findAll({
    order: [['name', 'ASC']]
  });
  
  // Add path to each category
  for (const category of categories) {
    category.dataValues.path = await category.getFullPath();
  }
  
  return categories;
};

// Get all children (including nested) of a category
Category.prototype.getAllChildren = async function() {
  const children = await Category.findAll({
    where: { parentId: this.id }
  });
  
  let allChildren = [...children];
  
  for (const child of children) {
    const childChildren = await child.getAllChildren();
    allChildren = [...allChildren, ...childChildren];
  }
  
  return allChildren;
};

module.exports = Category;