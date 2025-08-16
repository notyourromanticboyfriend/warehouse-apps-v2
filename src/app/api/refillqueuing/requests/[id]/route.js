// src/app/api/refillqueuing/requests/[id]/route.js
import { sql } from '@vercel/postgres';

// Helper function to convert to camelCase
const toCamelCase = (row) => {
  const camelData = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelData[camelKey] = value;
  }
  return camelData;
};

// Helper function to convert to snake_case
const toSnakeCase = (data) => {
  const snakeData = {};
  for (const [key, value] of Object.entries(data)) {
    const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    snakeData[snakeKey] = value;
  }
  return snakeData;
};

// Add this above the route handlers in both route.js files
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
          no_stock_input TEXT
        )
      `;
      console.log('Created requests table');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export async function PUT(request, { params }) {
  // Await params promise to get the actual params object
  const { id } = await params;
  
  try {
    await initDatabase();
    const updates = await request.json();
    const snakeUpdates = toSnakeCase(updates);

    // Build dynamic update query
    const setClauses = [];
    const values = [];
    
    Object.entries(snakeUpdates).forEach(([key, value]) => {
      // Skip null values for required fields
      if (key === 'item' && value === null) return;
      if (key === 'quantity' && value === null) return;
      
      setClauses.push(`${key} = $${values.length + 1}`);
      values.push(value);
    });
    
    if (values.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    values.push(id);

    const query = `
      UPDATE requests
      SET ${setClauses.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    
    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Request not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(toCamelCase(result.rows[0])), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update request',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request, { params }) {
  // Await params promise to get the actual params object
  const { id } = await params;
  
  try {
    await initDatabase();
    await sql`DELETE FROM requests WHERE id = ${id}`;
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete request',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}