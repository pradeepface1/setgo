import { karurSlipLayout } from './templates/karurSlip';
import { standardSlipLayout } from './templates/standardSlip';

/**
 * Factory method to route PDF generation to the correct tenant-specific template.
 * @param {Object|Array} tripOrTrips - Single trip or array of trips
 * @param {Object} preferences - the organization's preferences object
 */
export const generateHireSlip = (tripOrTrips, preferences = null) => {
    // Determine the template from preferences
    const slipTemplate = preferences?.pdfSettings?.slipTemplate || 'STANDARD';

    switch (slipTemplate) {
        case 'KARUR_CUSTOM':
            return karurSlipLayout(tripOrTrips, preferences);
        case 'STANDARD':
        default:
            return standardSlipLayout(tripOrTrips, preferences);
    }
};
