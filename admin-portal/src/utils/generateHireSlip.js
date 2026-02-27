import { karurSlipLayout } from './templates/karurSlip';
import { standardSlipLayout } from './templates/standardSlip';

/**
 * Factory method to route PDF generation to the correct tenant-specific template.
 * @param {Object|Array} tripOrTrips - Single trip or array of trips
 * @param {Object} preferences - the organization's preferences object
 */
export const generateHireSlip = (tripOrTrips, preferences = null) => {
    // We now always route to the fully customizable layout (previously Karur)
    return karurSlipLayout(tripOrTrips, preferences);
};
