const express = require('express');
const router = express.Router();
const Reference = require('../models/Reference');
const ScraperService = require('../services/scraperService');
const CategorizationService = require('../services/categorizationService');
const { authenticateToken } = require('./auth');
const googleDriveService = require('../services/googleDriveService');
const User = require('../models/User');

// Initialize services
const scraperService = new ScraperService();
const categorizationService = new CategorizationService();

// POST: Add reference from URL
router.post('/add-from-url', async (req, res) => {
    try {
        const { url, type } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!scraperService.isValidURL(url)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Extract metadata from URL
        const metadata = await scraperService.extractFromURL(url);
        
        if (!metadata.title) {
            return res.status(400).json({ error: 'Could not extract content from URL' });
        }

        // Extract PDF content if available
        if (metadata.pdfLink && !metadata.fullText) {
            try {
                metadata.fullText = await scraperService.extractPDFContent(metadata.pdfLink);
            } catch (error) {
                console.log('Could not extract PDF content:', error.message);
            }
        }

        // Categorize content
        const textForCategorization = metadata.fullText || metadata.abstract || metadata.title;
        metadata.discipline = categorizationService.categorize(textForCategorization);
        
        // Extract keywords
        metadata.keywords = categorizationService.extractKeywords(textForCategorization);

        // Create reference
        const referenceData = {
            ...metadata,
            url,
            type: type || 'jurnal' // Use provided type or default to jurnal
        };

        let savedReference;
        if (global.useTemporaryStore) {
            savedReference = await global.temporaryStore.save(referenceData);
        } else {
            const reference = new Reference(referenceData);
            savedReference = await reference.save();
        }
        
        res.json({ 
            success: true, 
            reference: {
                _id: savedReference._id,
                title: savedReference.title,
                authors: savedReference.authors,
                abstract: savedReference.abstract,
                type: savedReference.type,
                discipline: savedReference.discipline,
                publicationYear: savedReference.publicationYear,
                createdAt: savedReference.createdAt
            }
        });
        
    } catch (error) {
        console.error('Error adding reference:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Get all references with filters
router.get('/', async (req, res) => {
    try {
        const { type, discipline, search, limit = 20, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        let filter = {};
        let options = {};
        
        // Apply filters
        if (type && type !== 'all') filter.type = type;
        if (discipline && discipline !== 'all') filter.discipline = discipline;
        
        // Text search
        if (search) {
            filter.$text = { $search: search };
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        let references, total;
        if (global.useTemporaryStore) {
            references = await global.temporaryStore.find(filter, {
                sort,
                skip,
                limit: parseInt(limit)
            });
            total = await global.temporaryStore.countDocuments(filter);
        } else {
            references = await Reference.find(filter)
                .sort(sort)
                .limit(parseInt(limit))
                .skip(skip)
                .select('-fullText'); // Exclude full text for performance
            total = await Reference.countDocuments(filter);
        }
        
        res.json({
            references,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (error) {
        console.error('Error fetching references:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Get single reference by ID
router.get('/:id', async (req, res) => {
    try {
        let reference;
        if (global.useTemporaryStore) {
            reference = await global.temporaryStore.findById(req.params.id);
        } else {
            reference = await Reference.findById(req.params.id);
        }
        
        if (!reference) {
            return res.status(404).json({ error: 'Reference not found' });
        }
        
        res.json(reference);
        
    } catch (error) {
        console.error('Error fetching reference:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT: Update reference
router.put('/:id', async (req, res) => {
    try {
        const { title, authors, abstract, type, discipline, keywords, rating, bookmarked, tags } = req.body;
        
        const updateData = {};
        if (title) updateData.title = title;
        if (authors) updateData.authors = authors;
        if (abstract) updateData.abstract = abstract;
        if (type) updateData.type = type;
        if (discipline) updateData.discipline = discipline;
        if (keywords) updateData.keywords = keywords;
        if (rating !== undefined) updateData.rating = rating;
        if (bookmarked !== undefined) updateData.bookmarked = bookmarked;
        if (tags) updateData.tags = tags;
        
        let reference;
        if (global.useTemporaryStore) {
            reference = await global.temporaryStore.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true }
            );
        } else {
            reference = await Reference.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true }
            );
        }
        
        if (!reference) {
            return res.status(404).json({ error: 'Reference not found' });
        }
        
        res.json({ success: true, reference });
        
    } catch (error) {
        console.error('Error updating reference:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE: Delete reference
router.delete('/:id', async (req, res) => {
    try {
        let reference;
        if (global.useTemporaryStore) {
            reference = await global.temporaryStore.findByIdAndDelete(req.params.id);
        } else {
            reference = await Reference.findByIdAndDelete(req.params.id);
        }
        
        if (!reference) {
            return res.status(404).json({ error: 'Reference not found' });
        }
        
        res.json({ success: true, message: 'Reference deleted successfully' });
        
    } catch (error) {
        console.error('Error deleting reference:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Get statistics
router.get('/stats/overview', async (req, res) => {
    try {
        let totalReferences, typeStats, disciplineStats, recentReferences;
        
        if (global.useTemporaryStore) {
            totalReferences = await global.temporaryStore.countDocuments();
            typeStats = await global.temporaryStore.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]);
            disciplineStats = await global.temporaryStore.aggregate([
                { $group: { _id: '$discipline', count: { $sum: 1 } } }
            ]);
            recentReferences = await global.temporaryStore.find({}, {
                sort: { createdAt: -1 },
                limit: 5
            });
        } else {
            totalReferences = await Reference.countDocuments();
            
            typeStats = await Reference.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]);
            
            disciplineStats = await Reference.aggregate([
                { $group: { _id: '$discipline', count: { $sum: 1 } } }
            ]);
            
            recentReferences = await Reference.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('title authors createdAt type');
        }
        
        res.json({
            totalReferences,
            typeStats,
            disciplineStats,
            recentReferences
        });
        
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST: Bookmark toggle
router.post('/:id/bookmark', async (req, res) => {
    try {
        let reference;
        if (global.useTemporaryStore) {
            reference = await global.temporaryStore.findById(req.params.id);
            if (!reference) {
                return res.status(404).json({ error: 'Reference not found' });
            }
            reference.bookmarked = !reference.bookmarked;
            await global.temporaryStore.findByIdAndUpdate(req.params.id, {
                bookmarked: reference.bookmarked
            });
        } else {
            reference = await Reference.findById(req.params.id);
            if (!reference) {
                return res.status(404).json({ error: 'Reference not found' });
            }
            
            reference.bookmarked = !reference.bookmarked;
            await reference.save();
        }
        
        res.json({ 
            success: true, 
            bookmarked: reference.bookmarked 
        });
        
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST: Rate reference
router.post('/:id/rate', async (req, res) => {
    try {
        const { rating } = req.body;
        
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        
        let reference;
        if (global.useTemporaryStore) {
            reference = await global.temporaryStore.findByIdAndUpdate(
                req.params.id,
                { rating },
                { new: true }
            );
        } else {
            reference = await Reference.findByIdAndUpdate(
                req.params.id,
                { rating },
                { new: true }
            );
        }
        
        if (!reference) {
            return res.status(404).json({ error: 'Reference not found' });
        }
        
        res.json({ success: true, rating: reference.rating });
        
    } catch (error) {
        console.error('Error rating reference:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
