import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function columnExists(tableName, columnName) {
  const query = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = $1 
    AND column_name = $2;
  `;
  const result = await pool.query(query, [tableName, columnName]);
  return result.rows.length > 0;
}

async function addColumnIfNotExists(tableName, columnName, columnType, defaultValue = null) {
  const exists = await columnExists(tableName, columnName);
  
  if (!exists) {
    console.log(`Adding column ${columnName} to ${tableName}...`);
    let query = `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnType}`;
    
    // Add default value if provided
    if (defaultValue !== null) {
      query += ` DEFAULT ${defaultValue}`;
    }
    
    await pool.query(query);
    console.log(`Column ${columnName} added successfully to ${tableName}.`);
    return true;
  } else {
    console.log(`Column ${columnName} already exists in ${tableName}, skipping.`);
    return false;
  }
}

async function migrateDatabase() {
  console.log('Starting database migration...');
  
  try {
    // Add missing columns to service_requests table
    await addColumnIfNotExists('service_requests', 'completion_notes', 'TEXT');
    await addColumnIfNotExists('service_requests', 'material_used', 'TEXT');
    await addColumnIfNotExists('service_requests', 'completion_date', 'TIMESTAMP');
    await addColumnIfNotExists('service_requests', 'priority', 'INTEGER', '0');
    await addColumnIfNotExists('service_requests', 'quote_accepted', 'BOOLEAN', 'false');
    await addColumnIfNotExists('service_requests', 'scheduled_date', 'TIMESTAMP');
    
    // Add missing columns to appointments table
    await addColumnIfNotExists('appointments', 'reminder_sent', 'BOOLEAN', 'false');
    await addColumnIfNotExists('appointments', 'reminder_scheduled', 'BOOLEAN', 'false');
    
    console.log('Database migration completed successfully.');
  } catch (error) {
    console.error('Error during database migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateDatabase();