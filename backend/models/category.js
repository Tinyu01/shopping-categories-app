const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Category = sequelize.define('Category', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: false });

Category.belongsTo(Category, { as: 'Parent', foreignKey: 'parentId' });
Category.hasMany(Category, { as: 'Children', foreignKey: 'parentId' });

module.exports = Category;