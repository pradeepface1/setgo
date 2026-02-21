import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const standardSlipLayout = (tripOrTrips, preferences = null) => {
    const trips = Array.isArray(tripOrTrips) ? tripOrTrips : [tripOrTrips];
    const companyHeader = preferences?.theme?.companyHeader || "YOUR COMPANY NAME";

    // A5 size is typically good for receipts/slips (148 x 210 mm)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
    });

    trips.forEach((trip, index) => {
        if (index > 0) {
            doc.addPage();
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let currentY = 15;

        // Helper to draw horizontal line
        const drawLine = () => {
            doc.setLineWidth(0.5);
            doc.line(margin, currentY, pageWidth - margin, currentY);
            currentY += 5;
        };

        // --- HEADER ---
        // Top row: Slogan (center), Phones (right)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text(companyHeader, pageWidth / 2, currentY, { align: 'center' });
        currentY += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("TRANSPORT CONTRACTORS & COMMISSION AGENTS", pageWidth / 2, currentY, { align: 'center' });
        currentY += 8;

        drawLine(); // ---

        // --- TRIP DETAILS ---
        doc.setFontSize(10);
        const slipNo = trip.hireSlipNo ? trip.hireSlipNo.toString() : 'N/A';
        const docDate = trip.tripDateTime ? new Date(trip.tripDateTime).toLocaleDateString() : (trip.tripDate ? new Date(trip.tripDate).toLocaleDateString() : 'N/A');

        doc.setFont("helvetica", "bold");
        doc.text(`Document No :`, margin, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(slipNo, margin + 25, currentY);

        doc.setFont("helvetica", "bold");
        doc.text(`Date        :`, pageWidth / 2, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(docDate, pageWidth / 2 + 20, currentY);
        currentY += 8;

        const lorryName = trip.lorryName || trip.vehicleNumber || '----------';
        const vehicleNumber = trip.vehicleNumber || '----------';

        doc.setFont("helvetica", "bold");
        doc.text(`Lorry Name  :`, margin, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(lorryName, margin + 25, currentY);
        currentY += 6;

        doc.setFont("helvetica", "bold");
        doc.text(`Lorry No    :`, margin, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(vehicleNumber, margin + 25, currentY);
        currentY += 8;

        const ownerName = String(trip.ownerName || '----------');
        const ownerPhone = String(trip.ownerPhone || '----------');

        doc.setFont("helvetica", "bold");
        doc.text(`Owner       :`, margin, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(ownerName, margin + 25, currentY);
        currentY += 6;

        doc.setFont("helvetica", "bold");
        doc.text(`Contact     :`, margin, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(ownerPhone, margin + 25, currentY);
        currentY += 8;
        const fromLoc = String(trip.loadingLocation || '----------');
        const toLoc = String(trip.unloadingLocation || '----------');

        // Safely parse date
        let loadingDate = '----------';
        if (trip.loadingDate) {
            try {
                const dateObj = new Date(trip.loadingDate);
                if (!isNaN(dateObj)) {
                    loadingDate = dateObj.toLocaleDateString('en-GB');
                }
            } catch (e) {
                console.warn("Invalid loading date formatting", e);
            }
        }

        doc.setFont("helvetica", "bold");
        doc.text(`From        :`, margin, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(fromLoc, margin + 25, currentY);
        currentY += 6;

        doc.setFont("helvetica", "bold");
        doc.text(`To          :`, margin, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(toLoc, margin + 25, currentY);
        currentY += 6;

        doc.setFont("helvetica", "bold");
        doc.text(`Loading Date:`, margin, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(loadingDate, margin + 25, currentY);
        currentY += 8;

        drawLine(); // ---

        // --- FINANCIALS ---
        const totalHire = trip.driverTotalPayable || 0;
        const commission = trip.driverLoadingCommission || 0;
        const loading = trip.loadingCharge || 0;
        const otherExpenses = trip.driverOtherExpenses || 0;

        const grossTotal = totalHire - (commission + loading + otherExpenses);
        const advance = trip.driverAdvance || 0;
        const balance = grossTotal - advance;

        const rightColAlign = pageWidth - margin - 10;
        const valAlign = rightColAlign + 2;

        doc.setFont("helvetica", "normal");
        const weight = trip.actualWeight || 0;
        const rate = trip.driverRatePerTon || 0;
        const calculationText = (weight > 0 && rate > 0) ? ` (${weight} * ${rate})` : '';

        doc.text(`Total Lorry Hire${calculationText}`, margin, currentY);
        doc.text(`: Rs ${totalHire.toFixed(2)}`, rightColAlign, currentY, { align: 'right' });
        currentY += 6;

        doc.text("Commission", margin, currentY);
        doc.text(`: Rs ${commission.toFixed(2)}`, rightColAlign, currentY, { align: 'right' });
        currentY += 6;

        doc.text("Loading", margin, currentY);
        doc.text(`: Rs ${loading.toFixed(2)}`, rightColAlign, currentY, { align: 'right' });
        currentY += 6;

        doc.text("Other Expenses", margin, currentY);
        doc.text(`: Rs ${otherExpenses.toFixed(2)}`, rightColAlign, currentY, { align: 'right' });
        currentY += 6;

        drawLine(); // ---

        doc.setFont("helvetica", "bold");
        doc.text("Total", margin, currentY);
        doc.text(`: Rs ${grossTotal.toFixed(2)}`, rightColAlign, currentY, { align: 'right' });
        currentY += 6;

        doc.setFont("helvetica", "normal");
        doc.text("Advance", margin, currentY);
        doc.text(`: Rs ${advance.toFixed(2)}`, rightColAlign, currentY, { align: 'right' });
        currentY += 6;

        drawLine(); // ---

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Balance", margin, currentY);
        doc.text(`: Rs ${balance.toFixed(2)}`, rightColAlign, currentY, { align: 'right' });
        currentY += 8;

        drawLine(); // ---

        // --- DECLARATION ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("DECLARATION", pageWidth / 2, currentY, { align: 'center' });
        currentY += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const splitText = doc.splitTextToSize(
            "Received the goods in good condition myself the driver and the owner of the vehicle are jointly responsible for the safe carriage and delivery to the consignee. We will be responsible for damage or loss of consignment.",
            pageWidth - (margin * 2)
        );
        doc.text(splitText, margin, currentY);
        currentY += (splitText.length * 4) + 15; // Space for signature

        // --- SIGNATURES ---
        doc.setFontSize(9);
        doc.text("On behalf of Owner:", margin, currentY);
        doc.line(margin + 30, currentY + 1, margin + 65, currentY + 1);
        currentY += 15;

        doc.setFont("helvetica", "bold");
        doc.text(`For ${companyHeader}`, pageWidth - margin, currentY - 15, { align: 'right' });

        doc.setFont("helvetica", "normal");
        doc.text("Driver's Signature:", margin, currentY);
        doc.line(margin + 28, currentY + 1, margin + 65, currentY + 1);
        currentY += 10;

        // Add a line at bottom if needed, but not necessary here
    });

    // Return the blob/blobUrl or save
    const filename = trips.length > 1
        ? `Hire_Slips_Batch_${new Date().toISOString().split('T')[0]}.pdf`
        : `Hire_Slip_${trips[0].hireSlipNo !== undefined && trips[0].hireSlipNo !== null ? trips[0].hireSlipNo : trips[0]._id}.pdf`;

    doc.save(filename);
};
