# Academic Reference Reader

A modern web application for managing and reading academic papers with AI-powered categorization and organization features.

## Features

- 📚 **Smart Paper Management**: Upload PDFs or extract from URLs (Google Scholar, arXiv, ResearchGate, etc.)
- 🤖 **AI Categorization**: Automatic document classification and keyword extraction
- 📖 **PDF Web Viewer**: Read papers directly in the browser with embedded PDF viewer
- 🗂️ **Folder Organization**: Create custom folders to organize your research
- 🔍 **Advanced Search**: Search across titles, abstracts, and full text
- 📊 **Analytics Dashboard**: Track your reading progress and library statistics
- ☁️ **Google Drive Sync**: Sync your papers with Google Drive
- 👥 **User Management**: Personal accounts and authentication

## Technology Stack

### Backend
- Node.js with Express
- MongoDB for data storage
- PDF parsing and text extraction
- Google Drive API integration

### Frontend
- Modern responsive design with Tailwind CSS
- JavaScript ES6+ with modular architecture
- Interactive UI components and modals
- Real-time statistics and progress tracking

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Maftuuh1922/Academic-Reference-Reader.git
cd Academic-Reference-Reader
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the application:
```bash
# Start backend
cd backend
node server.js

# Frontend runs on http://localhost:3000
```

## Usage

1. **Add Papers**: Upload PDF files or paste URLs from academic sources
2. **Organize**: Create folders and categorize your papers
3. **Read**: Use the built-in PDF viewer with tabs for details and full document view
4. **Search**: Find papers by title, author, keywords, or content
5. **Track Progress**: Monitor your reading statistics and library growth

## API Endpoints

- `POST /api/references/add-from-url` - Extract paper from URL
- `POST /api/upload/upload-pdf` - Upload PDF file
- `GET /api/references` - Get all references with filters
- `GET /api/references/:id` - Get single reference
- `GET /api/upload/view/:id` - View PDF in browser
- `GET /api/upload/download/:id` - Download PDF file

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

**Maftuuh1922** - [GitHub](https://github.com/Maftuuh1922)

A powerful web application for extracting, managing, and reading academic references from various sources including Google Scholar, ResearchGate, IEEE, arXiv, and direct PDF files.

![Academic Reader Demo](https://img.shields.io/badge/Status-Ready-green.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)

## 🚀 Features

- **Multi-source Extraction**: Support for Google Scholar, ResearchGate, IEEE, arXiv, and direct PDF links
- **PDF Processing**: Upload and extract content from PDF files
- **Smart Categorization**: Automatic categorization by academic discipline
- **Full-text Search**: Search across titles, abstracts, and full content
- **Advanced Filtering**: Filter by type, discipline, and publication year
- **Bookmark System**: Save and organize important references
- **Rating System**: Rate references from 1-5 stars
- **Reading Interface**: Clean, distraction-free reading experience
- **Statistics Dashboard**: Overview of your reference collection

## 🛠️ Technology Stack

### Backend
- **Node.js + Express**: RESTful API server
- **MongoDB + Mongoose**: Database for storing references
- **Puppeteer**: Dynamic web scraping
- **Cheerio**: HTML parsing for static content
- **PDF-parse**: PDF content extraction
- **Natural**: Text processing and categorization

### Frontend
- **Vanilla JavaScript**: Modern ES6+ features
- **Tailwind CSS**: Utility-first CSS framework
- **Font Awesome**: Icon library
- **Responsive Design**: Mobile-friendly interface

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **MongoDB** (v6.0 or higher)
- **Git** (for cloning the repository)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd academic-reader
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set up MongoDB
Make sure MongoDB is running on your system. The application will connect to `mongodb://localhost:27017/academic-reader` by default.

#### Option A: Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb/brew/mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get the connection string
3. Set the `MONGODB_URI` environment variable:
   ```bash
   # Windows PowerShell
   $env:MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/academic-reader"
   
   # macOS/Linux
   export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/academic-reader"
   ```

### 4. Start the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

### 5. Access the Application
Open your browser and navigate to: `http://localhost:3000`

## 🎯 Usage Guide

### Adding References

#### From URL
1. Paste any supported URL in the input field:
   - Google Scholar article links
   - ResearchGate publication links
   - IEEE Xplore paper links
   - arXiv paper links
   - Direct PDF links
2. Select the reference type (Journal, Thesis, Book, Report)
3. Click "Extract & Save"

#### Upload PDF
1. Click the "Upload PDF" button in the header
2. Drag and drop a PDF file or click to browse
3. Optionally add title and authors
4. Select the reference type
5. Click "Upload & Process"

### Managing References

#### Search and Filter
- Use the search bar to find references by title, author, or content
- Filter by type (Journal, Thesis, Book, Report)
- Filter by academic discipline
- Sort by date added, title, publication year, or rating

#### Reading References
- Click "Read" on any reference card to open the reading interface
- View metadata, abstract, and full content
- Rate references from 1-5 stars
- Bookmark important references
- Access original source links

#### Statistics
- Click "Statistics" in the header to view collection overview
- See breakdown by type and discipline
- View recent additions

## 🔧 Configuration

### Environment Variables
You can customize the application using environment variables:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/academic-reader

# Server
PORT=3000
NODE_ENV=development

# For production
NODE_ENV=production
```

### Supported Sources

The application can extract content from:

1. **Google Scholar**: `scholar.google.com` - Extracts title, authors, abstract, publication info
2. **ResearchGate**: `researchgate.net` - Extracts publication metadata and abstracts
3. **IEEE Xplore**: `ieee.org` - Extracts paper information and abstracts
4. **arXiv**: `arxiv.org` - Extracts preprint information and abstracts
5. **Direct PDF**: Any `.pdf` URL - Extracts full text content
6. **Generic Web Pages**: Attempts to extract basic content from any URL

## 📊 API Endpoints

The application provides a RESTful API:

### References
- `POST /api/references/add-from-url` - Add reference from URL
- `GET /api/references` - Get all references with filters
- `GET /api/references/:id` - Get single reference
- `PUT /api/references/:id` - Update reference
- `DELETE /api/references/:id` - Delete reference
- `POST /api/references/:id/bookmark` - Toggle bookmark
- `POST /api/references/:id/rate` - Rate reference
- `GET /api/references/stats/overview` - Get statistics

### Upload
- `POST /api/upload/upload-pdf` - Upload PDF file
- `GET /api/upload/download/:id` - Download PDF file
- `GET /api/upload/view/:id` - View PDF in browser

## 🔍 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running. Check the service status and start if necessary.

#### PDF Processing Error
```
Error extracting PDF: File too large
```
**Solution**: The application has a 50MB limit for PDF files. Try with a smaller file.

#### Web Scraping Fails
```
Error extracting from URL: Navigation timeout
```
**Solution**: Some websites may block automated access. Try again later or use a different source.

#### Puppeteer Installation Issues
```
Error: Failed to launch chrome
```
**Solution**: Install missing dependencies:
```bash
# Ubuntu/Debian
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2

# Or install chromium separately
npm install puppeteer --unsafe-perm=true --allow-root
```

### Performance Tips

1. **Database Indexing**: The application automatically creates text indexes for search functionality
2. **Memory Usage**: Large PDF files may consume significant memory during processing
3. **Concurrent Requests**: The scraping service processes one request at a time to avoid being blocked

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Puppeteer](https://pptr.dev/) for web scraping capabilities
- [PDF-parse](https://www.npmjs.com/package/pdf-parse) for PDF text extraction
- [Natural](https://github.com/NaturalNode/natural) for text processing
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Font Awesome](https://fontawesome.com/) for icons

## 📧 Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information about your problem

---

**Happy researching! 📚🎓**
#   A c a d e m i c - R e f e r e n c e - R e a d e r 
 
 