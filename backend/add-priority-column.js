const { sequelize } = require('./config/database');

async function addPriorityColumn() {
  try {
    await sequelize.query('ALTER TABLE rental_applications ADD COLUMN priority VARCHAR(20) DEFAULT "normal" AFTER decision');
    console.log('✅ Added priority column to rental_applications table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding priority column:', error.message);
    process.exit(1);
  }
}

addPriorityColumn();
