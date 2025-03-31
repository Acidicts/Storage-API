class ImageService {
    constructor() {
        this.images = new Map(); // In-memory storage for images
        this.currentId = 0; // To generate unique IDs
    }

    async downloadImage(imageUrl) {
        const fetch = require('node-fetch');
        const fs = require('fs');
        const path = require('path');

        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch image from URL');
        }

        const buffer = await response.buffer();
        const imageId = this.generateUniqueId();
        const imagePath = path.join(__dirname, '../../storage/images', `${imageId}.jpg`);

        fs.writeFileSync(imagePath, buffer);
        this.images.set(imageId, { url: imageUrl, path: imagePath, timestamp: new Date() });

        return imageId;
    }

    getImage(imageId) {
        return this.images.get(imageId);
    }

    generateUniqueId() {
        return (++this.currentId).toString();
    }
}

module.exports = ImageService;