const { Sequelize } = require('sequelize');
const path = require('path');

// Environment configuration
const environment = process.env.NODE_ENV || 'development';

// Database configuration
const config = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};

// Initialize Sequelize with the appropriate configuration
const sequelize = new Sequelize(config[environment]);

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

// Run connection test when imported directly (not through require)
if (require.main === module) {
  testConnection();
}

module.exports = sequelize;