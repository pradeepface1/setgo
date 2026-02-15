const io = require('socket.io-client');

// const URL = 'http://localhost:5000'; // Local
const URL = 'https://backend-191882634358.asia-south1.run.app'; // Prod

console.log(`Connecting to ${URL}...`);

const socket = io(URL, {
    transports: ['websocket'],
    reconnection: true,
});

// const DRIVER_ID = '67ac317a026c06a09045331e'; 
const TEST_DRIVER_ID = '698d9725fc9e5edaa510b8f0';

socket.on('connect', () => {
    console.log('Connected! Socket ID:', socket.id);

    console.log('Emitting identify...');
    socket.emit('identify', { type: 'driver', id: TEST_DRIVER_ID });

    console.log('Emitting statusUpdate: ONLINE...');
    socket.emit('statusUpdate', {
        driverId: TEST_DRIVER_ID,
        status: 'ONLINE'
    });
});

socket.on('connect_error', (err) => {
    console.error('Connection Error:', err.message);
});

socket.on('disconnect', () => {
    console.log('Disconnected');
});

// Keep alive for a bit
setTimeout(() => {
    console.log('Done testing.');
    socket.disconnect();
    // process.exit(0);
}, 5000);
