/**
 * cPanel entry point
 * cPanel's "Setup Node.js App" will execute this file via Passenger.
 * It simply starts the Express backend which also serves the built frontend.
 */
'use strict';

// Pre-load .env before anything else (Passenger cwd = project root)
// override: true so .env values win over Passenger-injected empty vars
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env'), override: true });

const { startServer } = require('./backend/server.js');
startServer();
