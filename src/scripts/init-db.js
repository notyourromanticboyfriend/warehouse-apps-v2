async function initDatabase() {
  try {
    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'requests'
      )
    `;
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      await sql`
        CREATE TABLE requests (
          id BIGINT PRIMARY KEY,
          item TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          status TEXT NOT NULL,
          requested_by TEXT,
          requested_at TIMESTAMPTZ,
          processed_by TEXT,
          processed_at TIMESTAMPTZ,
          refilled_by TEXT,
          refilled_at TIMESTAMPTZ,
          no_stock_by TEXT,
          no_stock_at TIMESTAMPTZ,
          refiller_input TEXT,
          no_stock_input TEXT,
          processor_input TEXT  -- Added this column
        )
      `;
      console.log('Created requests table');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}