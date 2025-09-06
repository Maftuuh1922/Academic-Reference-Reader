const natural = require('natural');

class CategorizationService {
    constructor() {
        this.classifier = new natural.BayesClassifier();
        this.trainClassifier();
    }

    trainClassifier() {
        // Training data untuk kategorisasi berdasarkan disiplin ilmu
        const trainingData = [
            // Computer Science & Technology
            { text: 'machine learning artificial intelligence neural network deep learning algorithm', category: 'Computer Science' },
            { text: 'software engineering programming database system architecture', category: 'Computer Science' },
            { text: 'data mining big data analytics visualization computing', category: 'Computer Science' },
            { text: 'cybersecurity encryption network security protocol', category: 'Computer Science' },
            
            // Biology & Life Sciences
            { text: 'dna genetic protein biology molecular cell organism', category: 'Biology' },
            { text: 'evolution ecology biodiversity ecosystem species', category: 'Biology' },
            { text: 'medicine medical health disease treatment diagnosis', category: 'Medicine' },
            { text: 'pharmaceutical drug therapy clinical trial', category: 'Medicine' },
            
            // Business & Economics
            { text: 'marketing consumer behavior business strategy management', category: 'Business' },
            { text: 'economics finance market economy investment', category: 'Economics' },
            { text: 'accounting financial analysis revenue profit', category: 'Business' },
            
            // Engineering
            { text: 'mechanical engineering design manufacturing material', category: 'Engineering' },
            { text: 'electrical circuit electronics power system', category: 'Engineering' },
            { text: 'civil engineering construction building infrastructure', category: 'Engineering' },
            
            // Physics & Chemistry
            { text: 'physics quantum mechanics thermodynamics particle', category: 'Physics' },
            { text: 'chemistry chemical reaction compound molecular structure', category: 'Chemistry' },
            
            // Social Sciences
            { text: 'psychology behavior cognitive social interaction', category: 'Psychology' },
            { text: 'sociology society culture community social', category: 'Sociology' },
            { text: 'education learning teaching pedagogy curriculum', category: 'Education' },
            
            // Mathematics
            { text: 'mathematics mathematical statistics probability theorem', category: 'Mathematics' },
            { text: 'algebra calculus geometry topology analysis', category: 'Mathematics' },
            
            // Environmental Science
            { text: 'environment climate change sustainability pollution', category: 'Environmental Science' },
            { text: 'renewable energy solar wind environmental impact', category: 'Environmental Science' }
        ];

        trainingData.forEach(data => {
            this.classifier.addDocument(data.text, data.category);
        });

        this.classifier.train();
    }

    categorize(text) {
        if (!text || text.trim().length === 0) return 'General';
        
        try {
            // Clean and normalize text
            const cleanText = this.cleanText(text);
            const category = this.classifier.classify(cleanText);
            return category || 'General';
        } catch (error) {
            console.error('Error in categorization:', error);
            return 'General';
        }
    }

    extractKeywords(text) {
        if (!text || text.trim().length === 0) return [];
        
        try {
            // Simple tokenization - split by whitespace and clean
            const tokens = text.toLowerCase()
                .replace(/[^\w\s]/g, ' ') // Remove punctuation
                .split(/\s+/) // Split by whitespace
                .filter(token => token.length > 0);
            
            // Simple stop words list
            const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their', 'theirs'];
            
            // Filter meaningful words
            const keywords = tokens
                .filter(token => 
                    !stopWords.includes(token) && 
                    token.length > 3 && 
                    /^[a-zA-Z]+$/.test(token) // Only alphabetic characters
                )
                .reduce((acc, word) => {
                    acc[word] = (acc[word] || 0) + 1;
                    return acc;
                }, {});

            // Sort by frequency and return top keywords
            return Object.entries(keywords)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([word]) => word);
        } catch (error) {
            console.error('Error extracting keywords:', error);
            return [];
        }
    }

    cleanText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    // Get confidence score for categorization
    getCategoryConfidence(text) {
        if (!text || text.trim().length === 0) return { category: 'General', confidence: 0 };
        
        try {
            const cleanText = this.cleanText(text);
            const classifications = this.classifier.getClassifications(cleanText);
            
            if (classifications && classifications.length > 0) {
                return {
                    category: classifications[0].label,
                    confidence: classifications[0].value
                };
            }
            
            return { category: 'General', confidence: 0 };
        } catch (error) {
            console.error('Error getting confidence:', error);
            return { category: 'General', confidence: 0 };
        }
    }

    // Automatically detect document type based on URL, title, and content
    detectDocumentType(url, title, abstract, fullText) {
        const text = (title + ' ' + (abstract || '') + ' ' + (fullText || '')).toLowerCase();
        
        // Check URL patterns first
        if (url) {
            const urlLower = url.toLowerCase();
            
            // Journal patterns
            if (urlLower.includes('journal') || 
                urlLower.includes('ijcai') || 
                urlLower.includes('nips') || 
                urlLower.includes('icml') ||
                urlLower.includes('iclr') ||
                urlLower.includes('arxiv.org') ||
                urlLower.includes('scholar.google') ||
                urlLower.includes('researchgate') ||
                urlLower.includes('ieee.org')) {
                return 'jurnal';
            }
            
            // Thesis patterns
            if (urlLower.includes('thesis') || 
                urlLower.includes('dissertation') ||
                urlLower.includes('etd') ||
                urlLower.includes('repository')) {
                return 'tesis';
            }
        }
        
        // Check title and content patterns
        const titleLower = title ? title.toLowerCase() : '';
        
        // Thesis indicators
        if (titleLower.includes('thesis') || 
            titleLower.includes('dissertation') ||
            titleLower.includes('master') ||
            titleLower.includes('phd') ||
            titleLower.includes('doctoral') ||
            text.includes('thesis') ||
            text.includes('dissertation') ||
            text.includes('supervisor') ||
            text.includes('committee')) {
            return 'tesis';
        }
        
        // Book indicators
        if (titleLower.includes('handbook') ||
            titleLower.includes('introduction to') ||
            titleLower.includes('guide to') ||
            titleLower.includes('textbook') ||
            text.includes('chapter') ||
            text.includes('isbn') ||
            text.includes('publisher') ||
            text.includes('edition')) {
            return 'buku';
        }
        
        // Report indicators
        if (titleLower.includes('report') ||
            titleLower.includes('technical report') ||
            titleLower.includes('white paper') ||
            titleLower.includes('survey') ||
            text.includes('report') ||
            text.includes('findings') ||
            text.includes('recommendations')) {
            return 'laporan';
        }
        
        // Journal indicators (default for academic content)
        if (text.includes('abstract') ||
            text.includes('keywords') ||
            text.includes('introduction') ||
            text.includes('methodology') ||
            text.includes('results') ||
            text.includes('conclusion') ||
            text.includes('references') ||
            text.includes('doi') ||
            text.includes('published') ||
            text.includes('journal')) {
            return 'jurnal';
        }
        
        // Default to journal for academic content
        return 'jurnal';
    }
}

module.exports = CategorizationService;
