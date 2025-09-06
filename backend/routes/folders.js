const express = require('express');
const Folder = require('../models/Folder');
const Reference = require('../models/Reference');
const { authenticateToken } = require('./auth');
const googleDriveService = require('../services/googleDriveService');

const router = express.Router();

// Get all folders for authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const folders = await Folder.find({ userId: req.user.userId })
            .populate('referenceCount')
            .sort({ sortOrder: 1, name: 1 });

        // Get reference count for each folder
        const foldersWithCount = await Promise.all(
            folders.map(async (folder) => {
                const referenceCount = await Reference.countDocuments({ 
                    folderId: folder._id,
                    userId: req.user.userId 
                });
                return {
                    ...folder.toObject(),
                    referenceCount
                };
            })
        );

        res.json({
            success: true,
            folders: foldersWithCount
        });

    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new folder
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, color, icon, parentFolder } = req.body;

        // Check if folder name already exists for this user
        const existingFolder = await Folder.findOne({
            name,
            userId: req.user.userId,
            parentFolder: parentFolder || null
        });

        if (existingFolder) {
            return res.status(400).json({
                error: 'Folder with this name already exists'
            });
        }

        const folder = new Folder({
            name,
            description,
            color: color || '#3B82F6',
            icon: icon || 'fa-folder',
            userId: req.user.userId,
            parentFolder: parentFolder || null
        });

        await folder.save();

        // Create corresponding Google Drive folder if enabled
        if (req.user.preferences?.autoSaveToGoogleDrive) {
            const driveResult = await googleDriveService.createFolder(name);
            if (driveResult.success) {
                folder.googleDriveId = driveResult.folderId;
                await folder.save();
            }
        }

        res.status(201).json({
            success: true,
            message: 'Folder created successfully',
            folder
        });

    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update folder
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, description, color, icon, sortOrder } = req.body;

        const folder = await Folder.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        if (name) folder.name = name;
        if (description !== undefined) folder.description = description;
        if (color) folder.color = color;
        if (icon) folder.icon = icon;
        if (sortOrder !== undefined) folder.sortOrder = sortOrder;

        await folder.save();

        res.json({
            success: true,
            message: 'Folder updated successfully',
            folder
        });

    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete folder
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const folder = await Folder.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Check if folder has references
        const referenceCount = await Reference.countDocuments({ 
            folderId: folder._id,
            userId: req.user.userId 
        });

        if (referenceCount > 0) {
            return res.status(400).json({
                error: `Cannot delete folder. It contains ${referenceCount} references. Move or delete the references first.`
            });
        }

        // Check if folder has subfolders
        const subfolderCount = await Folder.countDocuments({
            parentFolder: folder._id,
            userId: req.user.userId
        });

        if (subfolderCount > 0) {
            return res.status(400).json({
                error: `Cannot delete folder. It contains ${subfolderCount} subfolders. Delete the subfolders first.`
            });
        }

        await Folder.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Folder deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: error.message });
    }
});

// Move references to folder
router.post('/:id/move-references', authenticateToken, async (req, res) => {
    try {
        const { referenceIds } = req.body;

        if (!Array.isArray(referenceIds) || referenceIds.length === 0) {
            return res.status(400).json({ error: 'Reference IDs array is required' });
        }

        const folder = await Folder.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Update references to move them to the folder
        const result = await Reference.updateMany(
            {
                _id: { $in: referenceIds },
                userId: req.user.userId
            },
            {
                folderId: folder._id
            }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} references moved to folder "${folder.name}"`,
            movedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Error moving references:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get folder tree structure
router.get('/tree', authenticateToken, async (req, res) => {
    try {
        const folders = await Folder.find({ userId: req.user.userId })
            .sort({ sortOrder: 1, name: 1 });

        // Build tree structure
        const buildTree = (parentId = null) => {
            return folders
                .filter(folder => 
                    (folder.parentFolder?.toString() || null) === (parentId?.toString() || null)
                )
                .map(folder => ({
                    ...folder.toObject(),
                    children: buildTree(folder._id)
                }));
        };

        const tree = buildTree();

        res.json({
            success: true,
            tree
        });

    } catch (error) {
        console.error('Error building folder tree:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
