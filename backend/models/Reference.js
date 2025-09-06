const mongoose = require('mongoose');

const referenceSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    text: true // Enable text search
  },
  authors: [String],
  abstract: {
    type: String,
    text: true // Enable text search
  },
  fullText: {
    type: String,
    text: true // Enable text search
  },
  url: String,
  type: { 
    type: String, 
    enum: ['jurnal', 'tesis', 'buku', 'laporan'],
    default: 'jurnal'
  },
  discipline: {
    type: String,
    default: 'General'
  },
  keywords: [String],
  publicationYear: Number,
  journal: String,
  doi: String,
  pdfPath: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  bookmarked: {
    type: Boolean,
    default: false
  },
  tags: [String],
  extractedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // New fields for user and folder support
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder'
  },
  // Google Drive integration
  googleDrive: {
    fileId: String,
    webViewLink: String,
    downloadLink: String,
    lastSynced: Date
  },
  // Enhanced metadata
  source: {
    type: String,
    enum: ['manual', 'url_extraction', 'pdf_upload', 'doi_lookup'],
    default: 'url_extraction'
  },
  extractionMetadata: {
    sourceUrl: String,
    extractedAt: Date,
    extractionMethod: String,
    confidence: Number
  }
});

// Create text index for search functionality
referenceSchema.index({
  title: 'text',
  abstract: 'text',
  fullText: 'text',
  authors: 'text',
  keywords: 'text'
});

// Update the updatedAt field before saving
referenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Reference', referenceSchema);
