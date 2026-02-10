/**
 * Migration Script: Convert to Multi-Tenant System
 * 
 * This script:
 * 1. Creates default "SetGo" organization
 * 2. Creates test organizations (ABC Transport, XYZ Logistics)
 * 3. Converts "Superadmin" user to SUPER_ADMIN role
 * 4. Converts "pradeep" user to ORG_ADMIN of SetGo
 * 5. Assigns all existing drivers to SetGo organization
 * 6. Assigns all existing trips to SetGo organization
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Organization = require('./models/Organization');
const User = require('./models/User');
const Driver = require('./models/Driver');
const Trip = require('./models/Trip');

async function migrateToMultiTenant() {
    try {
        console.log('🚀 Starting Multi-Tenant Migration...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/setgo-oncall');
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Create Organizations
        console.log('📦 Step 1: Creating Organizations...');

        // Check if SetGo organization already exists
        let setgoOrg = await Organization.findOne({ code: 'SETGO' });

        if (!setgoOrg) {
            setgoOrg = await Organization.create({
                name: 'setgo',
                code: 'SETGO',
                displayName: 'SetGo',
                contactEmail: 'admin@setgo.com',
                contactPhone: '9876543210',
                address: 'Bangalore, India',
                status: 'ACTIVE',
                settings: {
                    allowSOS: true,
                    enableReports: true,
                    timezone: 'Asia/Kolkata'
                }
            });
            console.log('   ✅ Created SetGo organization');
        } else {
            console.log('   ℹ️  SetGo organization already exists');
        }

        // Create test organizations
        const testOrgs = [
            {
                name: 'abc-transport',
                code: 'ABC001',
                displayName: 'ABC Transport',
                contactEmail: 'admin@abctransport.com',
                contactPhone: '9876543211',
                address: 'Mumbai, India'
            },
            {
                name: 'xyz-logistics',
                code: 'XYZ001',
                displayName: 'XYZ Logistics',
                contactEmail: 'admin@xyzlogistics.com',
                contactPhone: '9876543212',
                address: 'Delhi, India'
            }
        ];

        for (const orgData of testOrgs) {
            const existing = await Organization.findOne({ code: orgData.code });
            if (!existing) {
                await Organization.create({
                    ...orgData,
                    status: 'ACTIVE',
                    settings: {
                        allowSOS: true,
                        enableReports: true,
                        timezone: 'Asia/Kolkata'
                    }
                });
                console.log(`   ✅ Created ${orgData.displayName} organization`);
            } else {
                console.log(`   ℹ️  ${orgData.displayName} organization already exists`);
            }
        }

        console.log('\n👥 Step 2: Migrating Users...');

        // Update Superadmin user
        const superadmin = await User.findOne({ username: 'Superadmin' });
        if (superadmin) {
            superadmin.role = 'SUPER_ADMIN';
            superadmin.organizationId = null;
            superadmin.permissions = [
                'view_dashboard',
                'manage_drivers',
                'manage_commuters',
                'manage_trips',
                'view_reports',
                'manage_users',
                'manage_organizations'
            ];
            superadmin.status = 'ACTIVE';
            await superadmin.save();
            console.log('   ✅ Converted "Superadmin" to SUPER_ADMIN');
        } else {
            console.log('   ⚠️  Warning: "Superadmin" user not found');
        }

        // Update pradeep user
        const pradeep = await User.findOne({ username: 'pradeep' });
        if (pradeep) {
            pradeep.role = 'ORG_ADMIN';
            pradeep.organizationId = setgoOrg._id;
            pradeep.permissions = [
                'view_dashboard',
                'manage_drivers',
                'manage_commuters',
                'manage_trips',
                'view_reports',
                'manage_users'
            ];
            pradeep.status = 'ACTIVE';
            await pradeep.save();
            console.log('   ✅ Converted "pradeep" to ORG_ADMIN of SetGo');
        } else {
            console.log('   ⚠️  Warning: "pradeep" user not found');
        }

        // Update all other users to ORG_ADMIN of SetGo
        const otherUsers = await User.find({
            username: { $nin: ['Superadmin', 'pradeep'] },
            role: { $in: ['admin', 'superadmin'] }
        });

        for (const user of otherUsers) {
            user.role = 'ORG_ADMIN';
            user.organizationId = setgoOrg._id;
            user.permissions = [
                'view_dashboard',
                'manage_drivers',
                'manage_commuters',
                'manage_trips',
                'view_reports'
            ];
            user.status = 'ACTIVE';
            await user.save();
            console.log(`   ✅ Converted "${user.username}" to ORG_ADMIN of SetGo`);
        }

        console.log('\n🚗 Step 3: Migrating Drivers...');

        // First, drop the old unique index on phone
        try {
            await Driver.collection.dropIndex('phone_1');
            console.log('   ✅ Dropped old phone unique index');
        } catch (error) {
            console.log('   ℹ️  Old phone index not found (already dropped or doesn\'t exist)');
        }

        // Update all drivers without organizationId
        const driversToUpdate = await Driver.find({ organizationId: { $exists: false } });
        console.log(`   Found ${driversToUpdate.length} drivers to migrate`);

        for (const driver of driversToUpdate) {
            driver.organizationId = setgoOrg._id;
            await driver.save();
        }
        console.log(`   ✅ Assigned ${driversToUpdate.length} drivers to SetGo organization`);

        console.log('\n🚕 Step 4: Migrating Trips...');

        // Update all trips without organizationId
        const tripsToUpdate = await Trip.find({ organizationId: { $exists: false } });
        console.log(`   Found ${tripsToUpdate.length} trips to migrate`);

        for (const trip of tripsToUpdate) {
            trip.organizationId = setgoOrg._id;
            await trip.save();
        }
        console.log(`   ✅ Assigned ${tripsToUpdate.length} trips to SetGo organization`);

        console.log('\n📊 Migration Summary:');
        console.log('   Organizations created: 3 (SetGo, ABC Transport, XYZ Logistics)');
        console.log(`   Users migrated: ${otherUsers.length + 2}`);
        console.log(`   Drivers migrated: ${driversToUpdate.length}`);
        console.log(`   Trips migrated: ${tripsToUpdate.length}`);

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Restart your backend server');
        console.log('   2. Test login with "Superadmin" (should have full access)');
        console.log('   3. Test login with "pradeep" (should see only SetGo data)');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run migration
if (require.main === module) {
    migrateToMultiTenant()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = migrateToMultiTenant;
