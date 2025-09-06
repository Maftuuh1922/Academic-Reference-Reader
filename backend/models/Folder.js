const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    color: {
        type: String,
        default: '#3B82F6' // Default blue color
    },
    icon: {
        type: String,
        default: 'folder' // Font Awesome icon name
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentFolder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    googleDriveId: {
        type: String // ID folder di Google Drive
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index untuk performa
folderSchema.index({ userId: 1, name: 1 });
folderSchema.index({ userId: 1, parentFolder: 1 });

// Virtual untuk menghitung jumlah referensi
folderSchema.virtual('referenceCount', {
    ref: 'Reference',
    localField: '_id',
    foreignField: 'folderId',
    count: true
});

// Method untuk mendapatkan path lengkap folder
folderSchema.methods.getFullPath = async function() {
    let path = [this.name];
    let currentFolder = this;
    
    while (currentFolder.parentFolder) {
        currentFolder = await this.constructor.findById(currentFolder.parentFolder);
        if (currentFolder) {
            path.unshift(currentFolder.name);
        } else {
            break;
        }
    }
    
    return path.join(' / ');
};

module.exports = mongoose.model('Folder', folderSchema);
