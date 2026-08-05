require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function checkAndMigrate() {
    console.log('🔍 Checking database migration status...');

    // Ensure Prisma client is generated
    const clientPath = path.join(__dirname, '../node_modules/.prisma/client');
    if (!fs.existsSync(clientPath)) {
        console.log('Prisma client not found. Generating...');
        try {
            execSync('npx prisma generate --schema=prisma/schema', { stdio: 'inherit' });
        } catch (err) {
            console.error('Failed to generate Prisma client:', err.message);
        }
    }

    try {
        // Run migrate diff with exit-code flag.
        // Exit code 0 = no diff (in sync), 2 = diff detected, 1 = error.
        execSync('npx prisma migrate diff --exit-code --from-config-datasource --to-schema=prisma/schema', { stdio: 'ignore' });
        console.log('✅ Database schema is up to date. Skipping migrations and seeding.');
    } catch (error) {
        // execSync throws an error if exit code is non-zero
        if (error.status === 2) {
            console.log('⚠️ Detected database schema differences. Applying migrations and seeding...');
            try {
                // Apply/create migrations (interactive in dev, will prompt for name if there are unmigrated changes)
                execSync('npx prisma migrate dev', { stdio: 'inherit' });

                // Seed the database
                console.log('🌱 Seeding database...');
                execSync('npx prisma db seed', { stdio: 'inherit' });
            } catch (err) {
                console.error('❌ Failed to apply migrations or seed database:', err.message);
                process.exit(1);
            }
        } else {
            console.error('❌ Error checking database migration status:', error.message || error);
            // We don't exit with 1 here to avoid blocking start if the DB is temporarily down or unreachable
        }
    }
}

checkAndMigrate();
