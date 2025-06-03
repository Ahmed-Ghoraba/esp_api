const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// POST endpoint to receive data from ESP
app.post('/api/sensor', (req, res) => {
  try {
    const { sensorValue, deviceId } = req.body;
    console.log(`Received data - Device: ${deviceId}, Sensor Value: ${sensorValue}`);
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