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
    const { sensorValue, deviceId } = req.body;
    console.log(`Received data - Device: ${deviceId}, Sensor Value: ${sensorValue}`);

    // Broadcast data to all connected SSE clients
    const data = `data: ${JSON.stringify({ sensorValue, deviceId, timestamp: new Date().toISOString() })}\n\n`;
    clients.forEach((client) => {
      client.write(data);
    });

    res.status(200).json({ message: 'Data received successfully', data: req.body });
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
