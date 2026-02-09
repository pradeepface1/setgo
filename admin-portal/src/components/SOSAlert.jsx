import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { AlertTriangle, X } from 'lucide-react';

const SOSAlert = () => {
    const socket = useSocket();
    const [alerts, setAlerts] = useState([]);
    const [audio] = useState(new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3')); // Simple beep sound

    useEffect(() => {
        if (!socket) return;

        const handleSOS = (data) => {
            console.log('SOS Alert Received:', data);
            setAlerts(prev => [data, ...prev]);

            // Play sound
            audio.loop = true;
            audio.play().catch(e => console.error("Audio play failed", e));
        };

        socket.on('sos-alert', handleSOS);

        return () => {
            socket.off('sos-alert', handleSOS);
            audio.pause();
            audio.currentTime = 0;
        };
    }, [socket, audio]);

    const dismissAlert = (id) => {
        setAlerts(prev => {
            const newAlerts = prev.filter(alert => alert._id !== id);
            if (newAlerts.length === 0) {
                audio.pause();
                audio.currentTime = 0;
            }
            return newAlerts;
        });
    };

    if (alerts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
            {alerts.map((alert, index) => (
                <div key={index} className="bg-red-600 text-white p-4 rounded-lg shadow-2xl flex items-start justify-between animate-bounce">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-6 w-6 text-yellow-300" />
                            <h3 className="font-bold text-lg">SOS EMERGENCY!</h3>
                        </div>
                        <p className="font-medium">{alert.customerName}</p>
                        <p className="text-sm opacity-90">{alert.customerPhone}</p>
                        <p className="text-xs mt-1 bg-red-800 p-1 rounded inline-block">
                            {new Date(alert.createdAt).toLocaleTimeString()}
                        </p>
                    </div>
                    <button
                        onClick={() => dismissAlert(alert._id)}
                        className="text-white hover:text-gray-200 p-1 bg-red-700 rounded"
                    >
                        <X size={20} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default SOSAlert;
