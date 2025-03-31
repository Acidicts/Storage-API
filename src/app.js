const express = require('express');
const path = require('path');
const fs = require('fs');
const imageRoutes = require('./routes/imageRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug the images directory
const imagesDir = path.join(__dirname, '../storage/images');
console.log(`Images directory: ${imagesDir}`);
console.log(`Directory exists: ${fs.existsSync(imagesDir)}`);
if (fs.existsSync(imagesDir)) {
  console.log(`Files in directory: ${fs.readdirSync(imagesDir).join(', ')}`);
} else {
  // Create directory if it doesn't exist
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('Created images directory');
}

// Important: Serve static files - both routes should work
// Direct access to the storage directory
app.use('/storage', express.static(path.resolve(__dirname, '../storage')));

// API-based access
app.use('/api/images', express.static(path.resolve(__dirname, '../storage/images')));

// Serve static files for the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route - serve the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// API routes should come after static file middleware
app.use('/api', imageRoutes);

// Debugging route to check if an image exists
app.get('/debug-image/:filename', (req, res) => {
  const imagePath = path.join(__dirname, '../storage/images', req.params.filename);
  console.log(`Debug image request for: ${imagePath}`);
  if (fs.existsSync(imagePath)) {
    return res.sendFile(imagePath);
  } else {
    return res.status(404).send(`File not found: ${imagePath}`);
  }
});

// Add a route to list all files in the storage directory
app.get('/list-files', (req, res) => {
  try {
    const files = fs.readdirSync(imagesDir);
    const fileDetails = files.map(file => {
      const filePath = path.join(imagesDir, file);
      try {
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          isFile: stats.isFile(),
          path: filePath,
          exists: fs.existsSync(filePath)
        };
      } catch (err) {
        return { name: file, error: err.message };
      }
    });
    res.json({ 
      directory: imagesDir,
      exists: fs.existsSync(imagesDir),
      files: fileDetails
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Images are served from: ${imagesDir}`);
});