// Temporary in-memory storage for when MongoDB is not available
class TemporaryStore {
    constructor() {
        this.references = new Map();
        this.currentId = 1;
    }

    // Generate a MongoDB-like ObjectId
    generateId() {
        return this.currentId++; 
    }

    async save(data) {
        const id = this.generateId();
        const reference = {
            _id: id,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.references.set(id, reference);
        return reference;
    }

    async find(filter = {}, options = {}) {
        let results = Array.from(this.references.values());
        
        // Apply basic filters
        if (filter.type) {
            results = results.filter(ref => ref.type === filter.type);
        }
        if (filter.discipline) {
            results = results.filter(ref => ref.discipline === filter.discipline);
        }
        if (filter.$text && filter.$text.$search) {
            const searchTerm = filter.$text.$search.toLowerCase();
            results = results.filter(ref => 
                ref.title?.toLowerCase().includes(searchTerm) ||
                ref.abstract?.toLowerCase().includes(searchTerm) ||
                ref.authors?.some(author => author.toLowerCase().includes(searchTerm))
            );
        }

        // Apply sorting
        if (options.sort) {
            const sortField = Object.keys(options.sort)[0];
            const sortOrder = options.sort[sortField];
            results.sort((a, b) => {
                if (sortOrder === -1) {
                    return new Date(b[sortField]) - new Date(a[sortField]);
                } else {
                    return new Date(a[sortField]) - new Date(b[sortField]);
                }
            });
        }

        // Apply pagination
        if (options.skip) {
            results = results.slice(options.skip);
        }
        if (options.limit) {
            results = results.slice(0, options.limit);
        }

        return results;
    }

    async findById(id) {
        return this.references.get(parseInt(id)) || null;
    }

    async findByIdAndUpdate(id, updateData, options = {}) {
        const reference = this.references.get(parseInt(id));
        if (!reference) return null;

        const updated = {
            ...reference,
            ...updateData,
            updatedAt: new Date()
        };
        this.references.set(parseInt(id), updated);
        return options.new ? updated : reference;
    }

    async findByIdAndDelete(id) {
        const reference = this.references.get(parseInt(id));
        if (!reference) return null;
        
        this.references.delete(parseInt(id));
        return reference;
    }

    async countDocuments(filter = {}) {
        const results = await this.find(filter);
        return results.length;
    }

    async aggregate(pipeline) {
        // Basic aggregation for statistics
        const results = Array.from(this.references.values());
        
        if (pipeline[0] && pipeline[0].$group) {
            const groupBy = pipeline[0].$group._id;
            const counts = {};
            
            results.forEach(ref => {
                const key = groupBy.startsWith('$') ? ref[groupBy.substring(1)] : groupBy;
                counts[key] = (counts[key] || 0) + 1;
            });

            return Object.entries(counts).map(([key, count]) => ({
                _id: key,
                count
            }));
        }
        
        return results;
    }
}

module.exports = TemporaryStore;
