class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message) {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class DatabaseError extends AppError {
  constructor(message) {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

class ExternalServiceError extends AppError {
  constructor(message, service) {
    super(message, 502);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

class RateLimitError extends AppError {
  constructor(message) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

// Error handler factory
const createErrorHandler = (logger) => {
  return (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error with request context
    logger.error('Application Error', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      statusCode: err.statusCode,
      request: {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        user: req.user ? req.user.id : 'anonymous'
      }
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        status: 'fail',
        message: err.message,
        errors: err.errors
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Token expired'
      });
    }

    // Handle operational errors
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    }

    // Handle programming or unknown errors
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({
        status: 'error',
        message: err.message,
        stack: err.stack
      });
    }

    // Production error response
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  };
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  createErrorHandler
}; 