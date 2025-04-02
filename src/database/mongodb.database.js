const mongoose = require("mongoose");
const databaseConfig = require("../config/database.config");
const { logger } = require("../utils/logger.util");
const { DatabaseError } = require("../utils/error.util");

// Construct the connection string with proper encoding
const db = `mongodb+srv://${encodeURIComponent(databaseConfig.database_user)}:${encodeURIComponent(databaseConfig.database_password)}@cluster0.ieottwj.mongodb.net/${databaseConfig.database_name}?retryWrites=true&w=majority`;

const connectDB = async () => {
    try {
        logger.info('Attempting to connect to MongoDB', {
            database: databaseConfig.database_name,
            user: databaseConfig.database_user
        });
        
        await mongoose.connect(db, {
            serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
        });
        
        logger.info('✅ Database connected successfully');
    } catch (err) {
        logger.error('❌ Database connection failed', {
            error: err.message,
            code: err.code,
            name: err.name,
            stack: err.stack
        });
        
        // Log the connection string (without password) for debugging
        const debugConnectionString = db.replace(
            /:([^@]+)@/,
            ':****@'
        );
        logger.debug('Connection string (password hidden):', {
            connectionString: debugConnectionString
        });
        
        throw new DatabaseError(`Failed to connect to database: ${err.message}`);
    }
};

module.exports = connectDB;
