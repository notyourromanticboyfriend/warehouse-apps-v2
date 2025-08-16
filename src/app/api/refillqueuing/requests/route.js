//src/app/api/refillqueuing/requests/route.js
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

// In both GET handlers
export async function GET() {
  try {
    await initDatabase();
    const result = await sql`SELECT * FROM requests ORDER BY requested_at DESC`;
    return new Response(JSON.stringify(result.rows.map(toCamelCase)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request) {
  try {
    await initDatabase();
    const newReqData = await request.json();
    
    // Validate required fields
    if (!newReqData.item || !newReqData.quantity || !newReqData.requestedBy) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: item, quantity, or requestedBy' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const id = Date.now();
    
    const newReq = {
      id,
      item: newReqData.item,
      quantity: parseInt(newReqData.quantity, 10),
      status: 'REQUESTED',
      requestedBy: newReqData.requestedBy,
      requestedAt: new Date().toISOString(),
      processedAt: null,
      refilledAt: null,
      noStockAt: null,
      processedBy: null,
      refilledBy: null,
      noStockBy: null,
      refillerInput: '',
      noStockInput: '',
      processorInput: ''  // Added this field
    };

    const snakeData = toSnakeCase(newReq);

    await sql`
      INSERT INTO requests (
        id, item, quantity, status, requested_by, requested_at,
        processed_by, processed_at, refilled_by, refilled_at,
        no_stock_by, no_stock_at, refiller_input, no_stock_input, processor_input
      ) VALUES (
        ${snakeData.id}, 
        ${snakeData.item}, 
        ${snakeData.quantity}, 
        ${snakeData.status},
        ${snakeData.requested_by}, 
        ${snakeData.requested_at},
        ${snakeData.processed_by}, 
        ${snakeData.processed_at},
        ${snakeData.refilled_by}, 
        ${snakeData.refilled_at},
        ${snakeData.no_stock_by}, 
        ${snakeData.no_stock_at},
        ${snakeData.refiller_input}, 
        ${snakeData.no_stock_input},
        ${snakeData.processor_input}
      )
    `;
    
    return new Response(JSON.stringify(newReq), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create request',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request) {
  try {
    await initDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (startDate && endDate) {
      // Delete by date range
      await sql`
        DELETE FROM requests 
        WHERE requested_at BETWEEN ${startDate} AND ${endDate}
      `;
      console.log(`Deleted requests between ${startDate} and ${endDate}`);
    } else {
      // Delete all requests
      await sql`DELETE FROM requests`;
      console.log('Deleted all requests');
    }
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete requests',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}