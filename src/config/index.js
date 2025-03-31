const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    PORT: process.env.PORT || 3000,
    STORAGE_PATH: process.env.STORAGE_PATH || './storage/images',
    // Add other configuration settings as needed
};