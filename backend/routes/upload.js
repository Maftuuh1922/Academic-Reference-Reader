const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const Reference = require('../models/Reference');
const CategorizationService = require('../services/categorizationService');

// Initialize categorization service
const categorizationService = new CategorizationService();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to only accept PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// POST: Upload PDF file
router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const { title, authors, type, discipline } = req.body;
        
        // Read and parse PDF
        const pdfBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(pdfBuffer);
        
        // Extract title from file or use provided title
        let extractedTitle = title || req.file.originalname.replace('.pdf', '');
        
        // If no title provided, try to extract from PDF content
        if (!title && pdfData.text) {
            const lines = pdfData.text.split('\n').filter(line => line.trim().length > 0);
            if (lines.length > 0) {
                extractedTitle = lines[0].trim();
            }
        }

        // Parse authors
        let authorsList = [];
        if (authors) {
            authorsList = authors.split(',').map(author => author.trim());
        }

        // Categorize content
        const textForCategorization = pdfData.text || extractedTitle;
        const extractedDiscipline = discipline || categorizationService.categorize(textForCategorization);
        
        // Extract keywords
        const keywords = categorizationService.extractKeywords(textForCategorization);

        // Create reference
        const reference = new Reference({
            title: extractedTitle,
            authors: authorsList,
            fullText: pdfData.text,
            type: type || 'jurnal',
            discipline: extractedDiscipline,
            keywords,
            pdfPath: req.file.path
        });

        await reference.save();
        
        res.json({ 
            success: true, 
            reference: {
                _id: reference._id,
                title: reference.title,
                authors: reference.authors,
                type: reference.type,
                discipline: reference.discipline,
                createdAt: reference.createdAt
            }
        });
        
    } catch (error) {
        // Clean up uploaded file if error occurs
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        console.error('Error uploading PDF:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Download PDF file
router.get('/download/:id', async (req, res) => {
    try {
        const reference = await Reference.findById(req.params.id);
        
        if (!reference) {
            return res.status(404).json({ error: 'Reference not found' });
        }
        
        if (!reference.pdfPath) {
            return res.status(404).json({ error: 'PDF file not available' });
        }
        
        if (!fs.existsSync(reference.pdfPath)) {
            return res.status(404).json({ error: 'PDF file not found on server' });
        }
        
        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${reference.title}.pdf"`);
        
        // Stream the file
        const fileStream = fs.createReadStream(reference.pdfPath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('Error downloading PDF:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET: View PDF file in browser
router.get('/view/:id', async (req, res) => {
    try {
        const reference = await Reference.findById(req.params.id);
        
        if (!reference) {
            return res.status(404).json({ error: 'Reference not found' });
        }
        
        if (!reference.pdfPath) {
            return res.status(404).json({ error: 'PDF file not available' });
        }
        
        if (!fs.existsSync(reference.pdfPath)) {
            return res.status(404).json({ error: 'PDF file not found on server' });
        }
        
        // Set headers for PDF viewing
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        
        // Stream the file
        const fileStream = fs.createReadStream(reference.pdfPath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('Error viewing PDF:', error);
        res.status(500).json({ error: error.message });
    }
});

// Handle multer errors
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
        }
        return res.status(400).json({ error: error.message });
    }
    
    if (error.message === 'Only PDF files are allowed') {
        return res.status(400).json({ error: 'Only PDF files are allowed' });
    }
    
    next(error);
});

module.exports = router;
