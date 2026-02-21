import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const consignorSlipLayout = (tripOrTrips, preferences = null) => {
    const trips = Array.isArray(tripOrTrips) ? tripOrTrips : [tripOrTrips];

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
        const theme = preferences?.consignorTheme || preferences?.theme || {};
        const slogan = theme.slogan || "ll Sri Murugan Thunai ll";
        const companyHeader = theme.companyHeader || "N.S. KARUR ROADWAYS";
        const companySubHeader = theme.companySubHeader || "TRANSPORT CONTRACTORS & COMMISSION AGENTS";
        const phoneLine1 = theme.phoneLine1 || "Phone : 9448275227, 9739361561";
        const phoneLine2 = theme.phoneLine2 || "080-28523888, 080-28523777";
        const addressLine1 = theme.addressLine1 || "# 32, Behind HP Petrol Bunk, Old Chandapura";
        const addressLine2 = theme.addressLine2 || "Thirumagondanahalli Cross, Anekal Taluk, Bengaluru - 560099";

        // Top row: Slogan (center), Phones (right)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(slogan, pageWidth / 2, currentY, { align: 'center' });

        doc.setFontSize(7);
        doc.text(phoneLine1, pageWidth - margin, currentY, { align: 'right' });
        currentY += 3;
        doc.text(phoneLine2, pageWidth - margin, currentY, { align: 'right' });
        currentY += 6;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text(companyHeader, pageWidth / 2, currentY, { align: 'center' });
        currentY += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(companySubHeader, pageWidth / 2, currentY, { align: 'center' });
        currentY += 4;

        doc.setFontSize(8);
        doc.text(addressLine1, pageWidth / 2, currentY, { align: 'center' });
        currentY += 4;
        doc.text(addressLine2, pageWidth / 2, currentY, { align: 'center' });
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

        const consignorName = trip.consignorId?.name || trip.consignorDisplayName || '----------';
        const consignorPhone = trip.consignorId?.phone || '----------';

        doc.setFont("helvetica", "bold");
        doc.text(`Consignor     :`, margin, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(consignorName, margin + 25, currentY);
        currentY += 6;

        doc.setFont("helvetica", "bold");
        doc.text(`Mobile Num    :`, margin, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(consignorPhone, margin + 25, currentY);
        currentY += 6;

        const fromLoc = String(trip.loadingLocation || '----------');
        const toLoc = String(trip.unloadingLocation || '----------');
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

        // --- FINANCIALS FOR CONSIGNOR ---
        const rightColAlign = pageWidth - margin - 10;
        const valAlign = rightColAlign + 2;

        doc.setFont("helvetica", "normal");
        const expectedWeight = trip.expectedWeight || trip.actualWeight || 0;
        const rate = trip.ratePerTon || 0;
        const totalFreight = expectedWeight * rate;

        const advance = trip.consignorAdvance || 0;
        const balance = Math.max(0, totalFreight - advance);

        const calculationText = (expectedWeight > 0 && rate > 0) ? ` (${expectedWeight} * ${rate})` : '';

        doc.text(`Total Freight${calculationText}`, margin, currentY);
        doc.text(`: Rs ${totalFreight.toFixed(2)}`, rightColAlign, currentY, { align: 'right' });
        currentY += 6;

        doc.text("Advance Received", margin, currentY);
        doc.text(`: Rs ${advance.toFixed(2)}`, rightColAlign, currentY, { align: 'right' });
        currentY += 6;

        drawLine(); // ---

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Balance Due", margin, currentY);
        doc.text(`: Rs ${balance.toFixed(2)}`, rightColAlign, currentY, { align: 'right' });
        currentY += 8;

        drawLine(); // ---
        currentY += 5;

        doc.setFontSize(10);
        doc.text("CONSIGNOR COPY", pageWidth / 2, currentY, { align: 'center' });
        currentY += 20;

        // --- SIGNATURES ---
        doc.setFontSize(9);
        doc.text("Consignor Signature", margin, currentY);
        doc.line(margin + 35, currentY + 1, margin + 70, currentY + 1);

        doc.setFont("helvetica", "bold");
        doc.text("For N.S. Karur Roadways", pageWidth - margin, currentY - 15, { align: 'right' });
    });

    // Return the blob/blobUrl or save
    const filename = trips.length > 1
        ? `Consignor_Slips_Batch_${new Date().toISOString().split('T')[0]}.pdf`
        : `Consignor_Slip_${trips[0].hireSlipNo !== undefined && trips[0].hireSlipNo !== null ? trips[0].hireSlipNo : trips[0]._id}.pdf`;

    doc.save(filename);
};
