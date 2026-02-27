const express = require('express');
const router = express.Router();
const Consignor = require('../models/Consignor');
const { authenticate, filterByOrganization } = require('../middleware/auth');

// GET /api/consignors - List all consignors (filtered by org/vertical)
router.get('/', authenticate, filterByOrganization, async (req, res) => {
    try {
        const query = { ...req.organizationFilter };

        // Search Logic
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { name: searchRegex },
                { phone: searchRegex },
                { contactPerson: searchRegex }
            ];
        }

        // Pagination Logic
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const skip = (page - 1) * limit;

        if (limit > 0) {
            const [consignors, total] = await Promise.all([
                Consignor.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('organizationId', 'name displayName'),
                Consignor.countDocuments(query)
            ]);

            res.json({
                consignors,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });
        } else {
            const consignors = await Consignor.find(query).populate('organizationId', 'name displayName');
            res.json(consignors);
        }
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

// POST /api/consignors - Create a new consignor
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, contactPerson, phone, email, address, gstin, defaultRoutes } = req.body;

        // Determine Organization
        let organizationId = req.body.organizationId;
        if (req.user.role !== 'SUPER_ADMIN') {
            organizationId = req.user.organizationId;
        }

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        // Check for duplicate name within the same organization
        const normalizedName = name.replace(/\s+/g, ' ').trim();
        const existing = await Consignor.findOne({
            organizationId,
            name: { $regex: new RegExp(`^${normalizedName}$`, 'i') }
        });
        if (existing) {
            return res.status(409).json({ error: `A consignor named "${normalizedName}" already exists.` });
        }

        const newConsignor = new Consignor({
            organizationId,
            name: normalizedName,
            contactPerson,
            phone,
            email,
            address,
            gstin,
            defaultRoutes
        });

        await newConsignor.save();
        res.status(201).json(newConsignor);
    } catch (error) {
        res.status(400).json({ error: 'Creation failed', details: error.message });
    }
});

// POST /api/consignors/bulk - Bulk create consignors
router.post('/bulk', authenticate, async (req, res) => {
    try {
        const { consignors } = req.body;

        let organizationId = req.body.organizationId;
        if (req.user.role !== 'SUPER_ADMIN') {
            organizationId = req.user.organizationId;
        }

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        if (!Array.isArray(consignors) || consignors.length === 0) {
            return res.status(400).json({ error: 'A valid array of consignors is required.' });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < consignors.length; i++) {
            const row = consignors[i];
            const name = row['ConsignorName (Compulsory)'] || row.name || row.ConsignorName;
            const contactPerson = row['ContactPerson (Compulsory)'] || row.contactPerson || row.ContactPerson;
            const phone = row['MobileNumber (Compulsory)'] || row.phone || row.MobileNumber;
            const email = row['Email (Compulsory)'] || row.email || row.Email;
            const address = row['Address (Compulsory)'] || row.address || row.Address;
            const gstin = row['GSTIN (Compulsory)'] || row.gstin || row.GSTIN;

            if (!name || !contactPerson || !phone || !email || !address || !gstin) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: All fields are compulsory. Ensure ConsignorName, ContactPerson, MobileNumber, Email, Address, and GSTIN are provided.`);
                continue;
            }

            // Uniqueness validation (Requirement 2)
            const normalizedName = name.replace(/\s+/g, ' ').trim();
            const existing = await Consignor.findOne({
                organizationId,
                name: { $regex: new RegExp(`^${normalizedName}$`, 'i') }
            });

            if (existing) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: A consignor named "${normalizedName}" already exists.`);
                continue;
            }

            try {
                const newConsignor = new Consignor({
                    organizationId,
                    name: normalizedName,
                    contactPerson: contactPerson.trim(),
                    phone: phone.toString().trim(),
                    email: email.trim(),
                    address: address.trim(),
                    gstin: gstin.trim().toUpperCase()
                });
                await newConsignor.save();
                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }

        res.status(200).json(results);

    } catch (error) {
        res.status(500).json({ error: 'Bulk creation failed', details: error.message });
    }
});

// PUT /api/consignors/:id - Update a consignor
router.put('/:id', authenticate, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role === 'ORG_ADMIN' || req.user.role === 'LOGISTICS_ADMIN') {
            query.organizationId = req.user.organizationId;
        }

        const updatedConsignor = await Consignor.findOneAndUpdate(
            query,
            { $set: req.body },
            { new: true }
        );

        if (!updatedConsignor) {
            return res.status(404).json({ error: 'Consignor not found or access denied' });
        }

        res.json(updatedConsignor);
    } catch (error) {
        res.status(500).json({ error: 'Update failed', details: error.message });
    }
});

// DELETE /api/consignors/:id - Delete a consignor
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role === 'ORG_ADMIN' || req.user.role === 'LOGISTICS_ADMIN') {
            query.organizationId = req.user.organizationId;
        }

        const deletedConsignor = await Consignor.findOneAndDelete(query);
        if (!deletedConsignor) {
            return res.status(404).json({ error: 'Consignor not found or access denied' });
        }
        res.json({ message: 'Consignor deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Deletion failed', details: error.message });
    }
});

module.exports = router;
