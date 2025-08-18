const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const compression = require("compression");
const connectDB = require("./database/mongodb.database");
const appConfig = require("./config/app.config");
const { logger, stream, logRequest } = require("./utils/logger.util");
const { createErrorHandler, NotFoundError } = require("./utils/error.util");
const authRoutes = require("./routes/auth.route.js");
const userRoutes = require("./routes/user.route.js");
const addressRoutes = require('./routes/address.route.js');
const serviceRoutes = require('./routes/service.route.js');
const adminRoutes = require('./routes/admin.route');
const subserviceRoutes = require('./routes/subservice.route.js');
const bookingRoutes = require('./routes/booking.route.js');
const ratingRoutes = require('./routes/rating.route.js');
const serviceProviderRoutes = require('./routes/serviceProvider.route.js');

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Compression middleware
app.use(compression());

// Request logging
app.use(logRequest);

// HTTP request logging with Morgan
app.use(morgan('combined', { stream }));

// Database connection
connectDB()
  .then(() => logger.info("✅ Database connected successfully"))
  .catch((err) => {
    logger.error("❌ Database connection failed:", err);
    process.exit(1);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subservice', subserviceRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/service-providers', serviceProviderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Global error handling middleware
app.use(createErrorHandler(logger));

// Start server
const PORT = appConfig.port || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated!');
    process.exit(0);
  });
});
