const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store connected SSE clients
const clients = new Set();

// GET /api/sensor for SSE streaming
app.get('/api/sensor', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add client to set
  clients.add(res);

  // Send initial message to confirm connection
  res.write('data: {"message": "Connected to SSE stream"}\n\n');

  // Handle client disconnection
  req.on('close', () => {
    console.log('SSE client disconnected');
    clients.delete(res);
    res.end();
  });
});

// POST /api/sensor to receive data from ESP
app.post('/api/sensor', (req, res) => {
  try {
    const { timestamp, nitrogen, potassium, phosphorus } = req.body;

    // Log received data for debugging
    console.log('Received POST data:', JSON.stringify(req.body));

    // Use defaults for missing fields to maintain JSON structure
    const data = {
      timestamp: timestamp || new Date().toISOString(), // Fallback to current time if timestamp is missing
      nitrogen: nitrogen !== undefined ? nitrogen : -1.0,
      potassium: potassium !== undefined ? potassium : -1.0,
      phosphorus: phosphorus !== undefined ? phosphorus : -1.0
    };

    console.log(`Processed data - nitrogen: ${data.nitrogen}, phosphorus: ${data.phosphorus}, potassium: ${data.potassium}, timestamp: ${data.timestamp}`);

    // Broadcast data to all connected SSE clients
    const sseData = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach((client) => {
      client.write(sseData);
    });

    // Respond with exact JSON structure
    res.status(200).json({ message: 'Data received successfully', data });
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({ error: 'Failed to process data' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('API is running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
