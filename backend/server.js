const path = require('path');
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
app.use(cors({
  origin: [
    'https://adminportalstaging.setgo.in',
    'https://stagingadminportal.setgo.in',
    'https://admin-portal-191882634358.asia-south1.run.app',
    'https://setgo-487018.web.app',
    'https://setgo-487018.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://10.0.2.2:5001', // Android Emulator → Mac localhost
  ],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/jubilant_mvp';
console.log('Attempting to connect to MongoDB...');
// Mask the URI for logging if it contains credentials
const maskedURI = mongoURI.replace(/:([^:@]+)@/, ':****@');
console.log(`MongoDB URI: ${maskedURI}`);

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Socket.io Connection
// Socket.io Connection
// Track socket to driver mapping
const socketDriverMap = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Identify client type (admin or driver)
  socket.on('identify', (data) => {
    const { type, id } = data; // type: 'admin' | 'driver'
    console.log(`[Identify] Socket: ${socket.id} Type: ${type} ID: ${id || 'N/A'}`);

    if (type === 'admin') {
      socket.join('admin');
    } else if (type === 'driver') {
      socket.join('driver');
      if (id) {
        socket.join(`driver_${id}`);
        socketDriverMap.set(socket.id, id); // Map socket to driver ID

        // Mark as ONLINE on connection/identification
        mongoose.model('Driver').findByIdAndUpdate(id, { status: 'ONLINE' })
          .then(() => {
            io.to('admin').emit('driverLocationUpdate', { driverId: id, status: 'ONLINE' });
          })
          .catch(err => console.error('Error marking driver online:', err));
      }
    } else if (type === 'user') {
      socket.join(`user_${id}`);
    }
  });

  // Handle driver location updates
  socket.on('locationUpdate', async (data) => {
    // data: { driverId, lat, lng, status }

    try {
      const { driverId, lat, lng, status } = data;

      // Update mapping just in case
      if (driverId) {
        const currentMappedId = socketDriverMap.get(socket.id);
        if (currentMappedId && currentMappedId !== driverId) {
          console.warn(`[WARNING] Socket ${socket.id} switched driver ID from ${currentMappedId} to ${driverId}`);
        }
        socketDriverMap.set(socket.id, driverId);
      }

      console.log(`[LocationUpdate] Socket: ${socket.id}, Driver: ${driverId}, Status: ${status}`);

      // Persist to Database
      if (driverId) {
        const updatedDriver = await mongoose.model('Driver').findByIdAndUpdate(driverId, {
          status: status || 'ONLINE',
          currentLocation: { lat, lng }
        }, { new: true });

        // Add name to data for broadcast
        if (updatedDriver) {
          data.name = updatedDriver.name;
        }

        // Find Active Trip for this Driver to notify the User
        const activeTrip = await mongoose.model('Trip').findOne({
          assignedDriver: driverId,
          status: { $in: ['ASSIGNED', 'ACCEPTED', 'STARTED'] }
        });

        if (activeTrip && activeTrip.userId) {
          io.to(`user_${activeTrip.userId}`).emit('driverLocationUpdate', data);
        }
      }

      // Broadcast to all admins
      io.to('admin').emit('driverLocationUpdate', data);
    } catch (err) {
      console.error("Error updating driver location:", err);
    }
  });

  // Handle explicit status updates
  socket.on('statusUpdate', async (data) => {
    try {
      const { driverId, status } = data;
      if (driverId && status) {
        await mongoose.model('Driver').findByIdAndUpdate(driverId, { status: status });
        // Broadcast to admins
        io.to('admin').emit('driverLocationUpdate', { driverId, status });

        // If going OFFLINE, remove from map? 
        // No, keep map until disconnect unless they explicitly logout logic handled here?
        // Actually, let's just update DB.
      }
    } catch (err) {
      console.error("Error updating driver status:", err);
    }
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);

    const driverId = socketDriverMap.get(socket.id);
    if (driverId) {
      console.log(`Driver ${driverId} disconnected. Marking OFFLINE.`);
      try {
        await mongoose.model('Driver').findByIdAndUpdate(driverId, { status: 'OFFLINE' });
        io.to('admin').emit('driverLocationUpdate', { driverId, status: 'OFFLINE' });
        socketDriverMap.delete(socket.id);
      } catch (err) {
        console.error("Error handling driver disconnect:", err);
      }
    }
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
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/logistics', require('./routes/logistics')); // NEW
app.use('/api/consignors', require('./routes/consignors')); // NEW Consignors Route
app.use('/api/reports', require('./routes/reports'));
app.use('/api/rosters', require('./routes/rosters'));
app.use('/api/hand-loans', require('./routes/handLoans'));

app.get('/', (req, res) => {
  res.send('SetGo Backend API is Running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
