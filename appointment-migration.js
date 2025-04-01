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

async function migrateAppointmentsTable() {
  console.log('Starting appointments table migration...');
  
  try {
    // Add missing columns to appointments table
    await addColumnIfNotExists('appointments', 'start_time', 'TEXT');
    await addColumnIfNotExists('appointments', 'end_time', 'TEXT');
    await addColumnIfNotExists('appointments', 'duration', 'INTEGER');
    
    console.log('Appointments table migration completed successfully.');
  } catch (error) {
    console.error('Error during appointments table migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateAppointmentsTable();