const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const TemporaryStore = require('./utils/temporaryStore');

// Import routes
const referencesRoutes = require('./routes/references');
const uploadRoutes = require('./routes/upload');
const { router: authRoutes } = require('./routes/auth');
const foldersRoutes = require('./routes/folders');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection with better error handling
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/academic-reader', {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });
        console.log('✅ Connected to MongoDB');
        global.useTemporaryStore = false;
        return true;
    } catch (error) {
        console.warn('⚠️ MongoDB connection failed:', error.message);
        console.log('\n📋 MongoDB Setup Instructions:');
        console.log('1. Install MongoDB Community Edition from https://www.mongodb.com/try/download/community');
        console.log('2. Start MongoDB service:');
        console.log('   Windows: net start MongoDB');
        console.log('   macOS: brew services start mongodb/brew/mongodb-community');
        console.log('   Linux: sudo systemctl start mongod');
        console.log('3. Or use MongoDB Atlas cloud database');
        console.log('4. Restart this application');
        console.log('\n🔄 Using temporary in-memory storage instead of MongoDB.\n');
        
        // Initialize temporary store
        global.useTemporaryStore = true;
        global.temporaryStore = new TemporaryStore();
        return false;
    }
};

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        },
    },
}));

app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/references', referencesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/folders', foldersRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    database: global.useTemporaryStore ? 'temporary-in-memory' : 'mongodb'
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'Academic Reference Reader API',
        version: '1.0.0',
        description: 'API for extracting and managing academic references',
    database: global.useTemporaryStore ? 'temporary-in-memory' : 'mongodb',
        endpoints: {
            'GET /api/health': 'Health check',
            'POST /api/references/add-from-url': 'Add reference from URL',
            'GET /api/references': 'Get all references with filters',
            'GET /api/references/:id': 'Get single reference',
            'PUT /api/references/:id': 'Update reference',
            'DELETE /api/references/:id': 'Delete reference',
            'POST /api/references/:id/bookmark': 'Toggle bookmark',
            'POST /api/references/:id/rate': 'Rate reference',
            'GET /api/references/stats/overview': 'Get statistics',
            'POST /api/upload/upload-pdf': 'Upload PDF file',
            'GET /api/upload/download/:id': 'Download PDF file',
            'GET /api/upload/view/:id': 'View PDF in browser'
        }
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: Object.values(error.errors).map(err => err.message)
        });
    }
    
    if (error.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format'
        });
    }
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
const startServer = async () => {
    try {
        const dbConnected = await connectDB();
        
        app.listen(PORT, () => {
            console.log(`
🚀 Academic Reference Reader Server Started
📍 Port: ${PORT}
🌐 Frontend: http://localhost:${PORT}
📚 API: http://localhost:${PORT}/api
🏥 Health: http://localhost:${PORT}/api/health
📝 Environment: ${process.env.NODE_ENV || 'development'}
💾 Database: ${dbConnected ? 'MongoDB (Connected)' : 'Temporary In-Memory Store (MongoDB not connected)'}
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    mongoose.connection.close(() => {
        console.log('Database connection closed.');
        process.exit(0);
    });
});

startServer();

module.exports = app;
