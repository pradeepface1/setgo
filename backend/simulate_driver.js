const io = require('socket.io-client');

// Connect to backend
const socket = io('http://localhost:5000');

const driverId = 'driver_sim_1';
// Starting around Bangalore center
let lat = 12.9716;
let lng = 77.5946;

socket.on('connect', () => {
    console.log('Simulator connected:', socket.id);

    // Identify as driver
    socket.emit('identify', { type: 'driver', id: driverId });

    // Start emitting location
    setInterval(() => {
        // Move slightly
        lat += (Math.random() - 0.5) * 0.001;
        lng += (Math.random() - 0.5) * 0.001;

        const data = {
            driverId,
            lat,
            lng,
            status: 'ONLINE',
            speed: Math.random() * 60
        };

        console.log('Emitting location:', data);
        socket.emit('locationUpdate', data);
    }, 2000); // Every 2 seconds
});

socket.on('disconnect', () => {
    console.log('Simulator disconnected');
});

socket.on('error', (err) => {
    console.error('Socket error:', err);
});
