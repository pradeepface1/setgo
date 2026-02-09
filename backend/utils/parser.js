/**
 * Simple Regex-based parser for MVP.
 * Expected Format:
 * Request: [Name]
 * Date: [YYYY-MM-DD HH:mm]
 * Pickup: [Location]
 * Drop: [Location]
 * Vehicle: [Type]
 */
const parseWhatsAppMessage = (text) => {
    const lines = text.split('\n');
    const tripData = {
        originalText: text,
        requestSource: 'WHATSAPP',
        status: 'PENDING'
    };

    lines.forEach(line => {
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith('request:') || lowerLine.startsWith('name:')) {
            tripData.customerName = line.split(':')[1].trim();
        } else if (lowerLine.startsWith('date:') || lowerLine.startsWith('time:')) {
            tripData.tripDateTime = new Date(line.split(':')[1].trim());
        } else if (lowerLine.startsWith('pickup:')) {
            tripData.pickupLocation = line.split(':')[1].trim();
        } else if (lowerLine.startsWith('drop:')) {
            tripData.dropLocation = line.split(':')[1].trim();
        } else if (lowerLine.startsWith('vehicle:')) {
            tripData.vehiclePreference = line.split(':')[1].trim();
        }
    });

    return tripData;
};

module.exports = { parseWhatsAppMessage };
