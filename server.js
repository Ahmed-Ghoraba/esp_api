const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server and WebSocket server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const wss = new WebSocket.Server({ server });

// Store connected WebSocket clients
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);

  // Handle client disconnection
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });
});

// POST endpoint to receive data from ESP
app.post('/api/sensor', (req, res) => {
  try {
    const { sensorValue, deviceId } = req.body;
    console.log(`Received data - Device: ${deviceId}, Sensor Value: ${sensorValue}`);

    // Broadcast data to all connected WebSocket clients
    const data = JSON.stringify({ sensorValue, deviceId });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
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
