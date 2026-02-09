const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for MVP
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jubilant_mvp')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Socket.io Connection
// Socket.io Connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Identify client type (admin or driver)
  socket.on('identify', (data) => {
    const { type, id } = data; // type: 'admin' | 'driver'
    console.log(`Client identified: ${type} ${id || ''}`);

    if (type === 'admin') {
      socket.join('admin');
    } else if (type === 'driver') {
      socket.join('driver');
      if (id) socket.join(`driver_${id}`);
    }
  });

  // Handle driver location updates
  socket.on('locationUpdate', (data) => {
    // data: { driverId, lat, lng, status, ... }
    // console.log('Location update:', data); // Uncomment for debugging

    // Broadcast to all admins
    io.to('admin').emit('driverLocationUpdate', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const tripRoutes = require('./routes/trips');
const driverRoutes = require('./routes/drivers');
const authRoutes = require('./routes/auth');

// Routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/trips', tripRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sos', require('./routes/sos'));

app.get('/', (req, res) => {
  res.send('Jubilant Backend API is Running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
