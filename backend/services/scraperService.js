const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const pdfParse = require('pdf-parse');

class ScraperService {
    constructor() {
        this.browserConfig = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        };
        
        // Common user agents to rotate
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
        ];
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    async extractFromURL(url) {
        try {
            if (url.includes('scholar.google')) {
                return await this.extractFromGoogleScholar(url);
            } else if (url.includes('researchgate.net')) {
                return await this.extractFromResearchGate(url);
            } else if (url.includes('ieee.org')) {
                return await this.extractFromIEEE(url);
            } else if (url.includes('arxiv.org')) {
                return await this.extractFromArxiv(url);
            } else if (url.endsWith('.pdf')) {
                return await this.extractFromDirectPDF(url);
            } else {
                return await this.extractGeneric(url);
            }
        } catch (error) {
            console.error('Error extracting from URL:', error);
            throw new Error(`Failed to extract content: ${error.message}`);
        }
    }

    async extractFromGoogleScholar(url) {
        const browser = await puppeteer.launch(this.browserConfig);
        const page = await browser.newPage();
        
        try {
            await page.setUserAgent(this.getRandomUserAgent());
            await page.setViewport({ width: 1366, height: 768 });
            
            // Add some headers to look more like a real browser
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            });
            
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Wait a bit to avoid being detected as a bot
            await page.waitForTimeout(2000);
            
            const content = await page.evaluate(() => {
                // Try multiple selectors for title
                const titleSelectors = ['h3 a', '.gs_rt a', 'h3', '.gs_rt'];
                let title = '';
                for (const selector of titleSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        title = element.innerText || element.textContent;
                        break;
                    }
                }

                // Extract authors
                const authorsElement = document.querySelector('.gs_a');
                const authors = authorsElement ? authorsElement.innerText.split('-')[0].trim() : '';

                // Extract abstract/snippet
                const abstractElement = document.querySelector('.gs_rs');
                const abstract = abstractElement ? abstractElement.innerText : '';

                // Look for PDF link
                const pdfElement = document.querySelector('a[href*=".pdf"]');
                const pdfLink = pdfElement ? pdfElement.href : null;

                // Extract year
                const yearMatch = authorsElement ? authorsElement.innerText.match(/(\d{4})/) : null;
                const year = yearMatch ? parseInt(yearMatch[1]) : null;

                return {
                    title: title.trim(),
                    authors: authors ? [authors] : [],
                    abstract: abstract.trim(),
                    pdfLink,
                    publicationYear: year
                };
            });
            
            return content;
        } finally {
            await browser.close();
        }
    }

    async extractFromResearchGate(url) {
        const browser = await puppeteer.launch(this.browserConfig);
        const page = await browser.newPage();
        
        try {
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            const content = await page.evaluate(() => {
                const title = document.querySelector('h1')?.innerText || '';
                
                // Extract authors
                const authorElements = document.querySelectorAll('[data-testid="author-name"]');
                const authors = Array.from(authorElements).map(el => el.innerText);

                // Extract abstract
                const abstractElement = document.querySelector('[data-testid="publication-abstract"]');
                const abstract = abstractElement ? abstractElement.innerText : '';

                // Extract publication info
                const pubInfo = document.querySelector('.publication-meta')?.innerText || '';
                const yearMatch = pubInfo.match(/(\d{4})/);
                const year = yearMatch ? parseInt(yearMatch[1]) : null;

                return {
                    title: title.trim(),
                    authors,
                    abstract: abstract.trim(),
                    publicationYear: year
                };
            });
            
            return content;
        } finally {
            await browser.close();
        }
    }

    async extractFromArxiv(url) {
        try {
            // arXiv has a simple structure, use direct HTTP request
            const response = await axios.get(url, { timeout: 10000 });
            const $ = cheerio.load(response.data);
            
            const title = $('.title').text().replace('Title:', '').trim();
            const authors = $('.authors a').map((i, el) => $(el).text()).get();
            const abstract = $('.abstract').text().replace('Abstract:', '').trim();
            
            // Extract year from submission info
            const submissionInfo = $('.submission-history').text();
            const yearMatch = submissionInfo.match(/(\d{4})/);
            const year = yearMatch ? parseInt(yearMatch[1]) : null;

            // Look for PDF link
            const pdfLink = $('.download-pdf').attr('href');
            const fullPdfUrl = pdfLink ? `https://arxiv.org${pdfLink}` : null;

            return {
                title,
                authors,
                abstract,
                publicationYear: year,
                pdfLink: fullPdfUrl
            };
        } catch (error) {
            throw new Error(`Failed to extract from arXiv: ${error.message}`);
        }
    }

    async extractFromIEEE(url) {
        const browser = await puppeteer.launch(this.browserConfig);
        const page = await browser.newPage();
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            const content = await page.evaluate(() => {
                const title = document.querySelector('.document-title span')?.innerText || '';
                
                const authorElements = document.querySelectorAll('.authors-info .author');
                const authors = Array.from(authorElements).map(el => el.innerText);

                const abstractElement = document.querySelector('.abstract-text');
                const abstract = abstractElement ? abstractElement.innerText : '';

                // Extract publication year
                const pubDate = document.querySelector('.publication-date')?.innerText || '';
                const yearMatch = pubDate.match(/(\d{4})/);
                const year = yearMatch ? parseInt(yearMatch[1]) : null;

                return {
                    title: title.trim(),
                    authors,
                    abstract: abstract.trim(),
                    publicationYear: year
                };
            });
            
            return content;
        } finally {
            await browser.close();
        }
    }

    async extractFromDirectPDF(url) {
        try {
            const response = await axios.get(url, { 
                responseType: 'arraybuffer',
                timeout: 30000,
                maxContentLength: 50 * 1024 * 1024 // 50MB limit
            });
            
            const pdfData = await pdfParse(response.data);
            
            // Try to extract title from first few lines
            const lines = pdfData.text.split('\n').filter(line => line.trim().length > 0);
            const title = lines.length > 0 ? lines[0].trim() : 'PDF Document';

            return {
                title,
                authors: [],
                abstract: '',
                fullText: pdfData.text,
                pdfLink: url
            };
        } catch (error) {
            throw new Error(`Failed to extract PDF: ${error.message}`);
        }
    }

    async extractGeneric(url) {
        try {
            // Try with different approaches
            const config = {
                timeout: 10000,
                headers: {
                    'User-Agent': this.getRandomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            };

            let response;
            try {
                response = await axios.get(url, config);
            } catch (error) {
                if (error.response && error.response.status === 403) {
                    // Try with Puppeteer for 403 errors
                    console.log('403 error with axios, trying with Puppeteer...');
                    return await this.extractWithPuppeteer(url);
                }
                throw error;
            }
            
            const $ = cheerio.load(response.data);
            
            // Try to extract basic information
            const title = $('title').text() || $('h1').first().text() || 'Web Page';
            
            // Look for meta description
            const abstract = $('meta[name="description"]').attr('content') || 
                           $('meta[property="og:description"]').attr('content') || '';

            // Extract main content
            const contentSelectors = ['article', '.content', '.main', '#content', 'main'];
            let fullText = '';
            
            for (const selector of contentSelectors) {
                const element = $(selector);
                if (element.length > 0) {
                    fullText = element.text().trim();
                    break;
                }
            }

            return {
                title: title.trim(),
                authors: [],
                abstract: abstract.trim(),
                fullText: fullText || $('body').text().substring(0, 5000) // Limit to 5000 chars
            };
        } catch (error) {
            throw new Error(`Failed to extract from generic URL: ${error.message}`);
        }
    }

    async extractWithPuppeteer(url) {
        const browser = await puppeteer.launch(this.browserConfig);
        const page = await browser.newPage();
        
        try {
            await page.setUserAgent(this.getRandomUserAgent());
            await page.setViewport({ width: 1366, height: 768 });
            
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            });
            
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await page.waitForTimeout(3000); // Wait for dynamic content
            
            const content = await page.evaluate(() => {
                const title = document.title || document.querySelector('h1')?.innerText || 'Web Page';
                
                const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                                      document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
                
                // Try to find main content
                const contentSelectors = ['article', '.content', '.main', '#content', 'main'];
                let fullText = '';
                
                for (const selector of contentSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        fullText = element.innerText || element.textContent;
                        break;
                    }
                }
                
                if (!fullText) {
                    fullText = document.body.innerText.substring(0, 5000);
                }
                
                return {
                    title: title.trim(),
                    authors: [],
                    abstract: metaDescription.trim(),
                    fullText: fullText.trim()
                };
            });
            
            return content;
        } finally {
            await browser.close();
        }
    }

    async extractPDFContent(pdfUrl) {
        try {
            const response = await axios.get(pdfUrl, { 
                responseType: 'arraybuffer',
                timeout: 30000,
                maxContentLength: 50 * 1024 * 1024 // 50MB limit
            });
            
            const pdfData = await pdfParse(response.data);
            return pdfData.text;
        } catch (error) {
            console.error('Error extracting PDF content:', error);
            return null;
        }
    }

    // Utility method to validate URL
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = ScraperService;
