const express = require('express');
const sequelize = require('./db');
const Category = require('./models/category');

const app = express();
app.use(express.json());

sequelize.sync();

app.get('/categories', async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/categories', async (req, res) => {
    try {
        const { name, parentId, description } = req.body;
        const category = await Category.create({ name, parentId, description });
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, parentId, description } = req.body;
        const category = await Category.findByPk(id);
        if (category) {
            await category.update({ name, parentId, description });
            res.json(category);
        } else {
            res.status(404).json({ error: 'Category not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const hasChildren = await Category.count({ where: { parentId: id } });
        if (hasChildren > 0) {
            return res.status(400).json({ error: 'Cannot delete category with children' });
        }
        const category = await Category.findByPk(id);
        if (category) {
            await category.destroy();
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});