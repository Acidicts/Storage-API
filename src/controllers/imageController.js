const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const url = require('url');

// Storage directory
const STORAGE_DIR = path.join(__dirname, '../../storage/images');
const ID_FILE = path.join(STORAGE_DIR, 'lastId.txt');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  try {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    console.log(`Created storage directory: ${STORAGE_DIR}`);
  } catch (error) {
    console.error(`Error creating storage directory: ${error.message}`);
  }
}

// Get the next available ID
const getNextId = () => {
  try {
    if (fs.existsSync(ID_FILE)) {
      const lastId = parseInt(fs.readFileSync(ID_FILE, 'utf8'), 10);
      return lastId + 1;
    } else {
      return 1; // Start with ID 1 if file doesn't exist
    }
  } catch (error) {
    console.error('Error reading last ID:', error);
    return 1; // Start with ID 1 on error
  }
};

// Save the last used ID
const saveLastId = (id) => {
  try {
    fs.writeFileSync(ID_FILE, id.toString(), 'utf8');
  } catch (error) {
    console.error('Error saving last ID:', error);
  }
};

const downloadImage = (imageUrl, filepath) => {
  return new Promise((resolve, reject) => {
    try {
      // Parse the URL
      const parsedUrl = new URL(imageUrl);
      
      // Choose the correct protocol module
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      console.log(`Downloading image from: ${imageUrl} to ${filepath}`);
      
      const request = protocol.get(imageUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          console.log(`Redirecting to: ${redirectUrl}`);
          return downloadImage(redirectUrl, filepath)
            .then(resolve)
            .catch(reject);
        }
        
        // Check for successful response
        if (response.statusCode !== 200) {
          return reject(new Error(`Failed to download image: ${response.statusCode}`));
        }
        
        // Check content type to ensure it's an image
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
          console.warn(`Warning: Content-Type is not an image: ${contentType}`);
        }
        
        // Create write stream
        const fileStream = fs.createWriteStream(filepath);
        
        // Pipe response to file
        response.pipe(fileStream);
        
        // Handle file stream completion
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Image downloaded successfully to: ${filepath}`);
          resolve();
        });
        
        // Handle file stream errors
        fileStream.on('error', (err) => {
          fs.unlink(filepath, () => {}); // Clean up on error
          console.error(`Error writing file: ${err.message}`);
          reject(err);
        });
      });
      
      // Handle request errors
      request.on('error', (err) => {
        console.error(`Error downloading image: ${err.message}`);
        reject(err);
      });
      
      // Set timeout
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Request timeout after 30 seconds'));
      });
    } catch (error) {
      console.error(`Exception in downloadImage: ${error.message}`);
      reject(error);
    }
  });
};

// Controller as an object with methods
const imageController = {
  // Store an image from a URL
  async postImage(req, res) {
    try {
      console.log('POST /api/images request received:', req.body);
      
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        console.log('Error: No image URL provided');
        return res.status(400).json({ error: 'Image URL is required' });
      }
      
      // Validate URL format
      try {
        new URL(imageUrl);
      } catch (error) {
        console.log(`Error: Invalid URL format: ${imageUrl}`);
        return res.status(400).json({ error: 'Invalid URL format' });
      }
      
      // Generate a sequential ID
      const imageId = getNextId();
      console.log(`Generated image ID: ${imageId}`);
      
      // Determine file extension from URL
      let fileExtension;
      try {
        const parsedUrl = new URL(imageUrl);
        const pathname = parsedUrl.pathname;
        fileExtension = path.extname(pathname);
        
        // Default to .jpg if no extension found
        if (!fileExtension) {
          console.log('No file extension in URL, defaulting to .jpg');
          fileExtension = '.jpg';
        }
      } catch (error) {
        console.log('Error parsing URL for extension, defaulting to .jpg');
        fileExtension = '.jpg';
      }
      
      const filename = `${imageId}${fileExtension}`;
      const filepath = path.join(STORAGE_DIR, filename);
      console.log(`Will save image to: ${filepath}`);
      
      // Check if storage directory exists and create if it doesn't
      if (!fs.existsSync(STORAGE_DIR)) {
        console.log(`Storage directory doesn't exist, creating: ${STORAGE_DIR}`);
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
      }
      
      // Check if we have write permissions
      try {
        const testFile = path.join(STORAGE_DIR, '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log('Write permissions confirmed for storage directory');
      } catch (error) {
        console.error(`No write permissions for storage directory: ${error.message}`);
        return res.status(500).json({ error: 'Server has no write permissions for storage directory' });
      }
      
      // Download and store the image
      await downloadImage(imageUrl, filepath);
      
      // Save the last used ID
      saveLastId(imageId);
      
      console.log(`Image stored successfully with ID: ${imageId}, filename: ${filename}`);
      
      return res.status(201).json({ 
        id: imageId, 
        url: `/api/images/${filename}`,
        filename 
      });
    } catch (error) {
      console.error('Error storing image:', error);
      return res.status(500).json({ 
        error: 'Failed to store image', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Retrieve a stored image
  getImage(req, res) {
    try {
      const { id } = req.params;
      console.log(`GET /api/images/${id} request received`);
      
      // Check if the id includes a file extension
      if (path.extname(id)) {
        // Id is a filename (e.g. 1.jpg)
        const imagePath = path.join(STORAGE_DIR, id);
        console.log(`Looking for file with extension: ${imagePath}`);
        
        if (fs.existsSync(imagePath)) {
          console.log(`File found: ${imagePath}`);
          return res.sendFile(imagePath);
        }
      } else {
        // Id is just a number (e.g. 1)
        // Find the image file with the given ID
        const files = fs.readdirSync(STORAGE_DIR).filter(file => file !== 'lastId.txt');
        console.log(`Looking for file with ID ${id} among ${files.length} files: ${files.join(', ')}`);
        
        const imageFile = files.find(file => {
          const fileId = path.parse(file).name;
          return fileId === id;
        });
        
        if (imageFile) {
          const imagePath = path.join(STORAGE_DIR, imageFile);
          console.log(`Found file: ${imagePath}`);
          return res.sendFile(imagePath);
        }
      }
      
      console.log(`Image not found: ${id}`);
      return res.status(404).json({ error: 'Image not found' });
    } catch (error) {
      console.error('Error retrieving image:', error);
      return res.status(500).json({ error: 'Failed to retrieve image' });
    }
  },

  // List all stored images
  getAllImages(req, res) {
    try {
      console.log('GET /api/images request received');
      
      // Filter out the lastId.txt file
      const files = fs.readdirSync(STORAGE_DIR).filter(file => file !== 'lastId.txt');
      console.log(`Found ${files.length} files in storage`);
      
      const images = files.map(file => {
        const id = path.parse(file).name;
        return {
          id,
          url: `/api/images/${file}`,
          filename: file
        };
      });
      
      // Sort images by ID numerically
      images.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      
      console.log(`Returning ${images.length} images`);
      return res.status(200).json({ images });
    } catch (error) {
      console.error('Error listing images:', error);
      return res.status(500).json({ error: 'Failed to list images' });
    }
  },

  // Delete a stored image
  deleteImage(req, res) {
    try {
      const { id } = req.params;
      console.log(`DELETE /api/images/${id} request received`);
      
      // Find the image file with the given ID
      const files = fs.readdirSync(STORAGE_DIR);
      const imageFile = files.find(file => {
        const fileId = path.parse(file).name;
        return fileId === id;
      });
      
      if (!imageFile) {
        console.log(`Image not found for deletion: ${id}`);
        return res.status(404).json({ error: 'Image not found' });
      }
      
      const imagePath = path.join(STORAGE_DIR, imageFile);
      console.log(`Deleting file: ${imagePath}`);
      
      // Delete the file
      fs.unlinkSync(imagePath);
      
      console.log(`Image deleted successfully: ${id}`);
      return res.status(200).json({ 
        message: 'Image deleted successfully', 
        id 
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      return res.status(500).json({ error: 'Failed to delete image' });
    }
  },
  
  // Test the image storage functionality
  testStorage(req, res) {
    try {
      console.log('TEST /api/test-storage request received');
      
      // Check if storage directory exists
      const directoryExists = fs.existsSync(STORAGE_DIR);
      
      // Check write permissions
      let canWrite = false;
      try {
        const testFile = path.join(STORAGE_DIR, '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        canWrite = true;
      } catch (error) {
        console.error('Write permission test failed:', error);
      }
      
      // List existing files
      let files = [];
      if (directoryExists) {
        files = fs.readdirSync(STORAGE_DIR);
      }
      
      // Return diagnostic information
      return res.status(200).json({
        storage: {
          directory: STORAGE_DIR,
          exists: directoryExists,
          canWrite: canWrite
        },
        files: files,
        environment: {
          platform: process.platform,
          nodeVersion: process.version,
          cwd: process.cwd()
        }
      });
    } catch (error) {
      console.error('Error in test storage:', error);
      return res.status(500).json({ error: 'Test storage failed', details: error.message });
    }
  }
};

module.exports = imageController;