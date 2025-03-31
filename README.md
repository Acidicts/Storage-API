# Image Storage API

This project is an image storage API built with Node.js and Express. It allows users to store images by providing a URL and retrieve them using a unique ID.

## Features

- Store images from a URL
- Retrieve stored images using a unique ID
- Simple RESTful API

## Project Structure

```
image-storage-api
├── src
│   ├── app.js                # Entry point of the application
│   ├── config
│   │   └── index.js          # Configuration settings
│   ├── controllers
│   │   └── imageController.js # Logic for handling image requests
│   ├── middlewares
│   │   └── index.js          # Middleware functions
│   ├── models
│   │   └── image.js          # Image data model
│   ├── routes
│   │   └── imageRoutes.js     # API routes
│   ├── services
│   │   └── imageService.js    # Business logic for image handling
│   └── utils
│       └── helpers.js         # Utility functions
├── storage
│   └── images                 # Directory for storing images
├── .env.example               # Example environment variables
├── .gitignore                 # Files to ignore in version control
├── package.json               # NPM configuration file
└── README.md                  # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/image-storage-api.git
   ```

2. Navigate to the project directory:
   ```
   cd image-storage-api
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Create a `.env` file based on the `.env.example` file and configure your environment variables.

## Usage

To start the server, run:
```
npm start
```

The API will be available at `http://localhost:3000`.

### API Endpoints

- **POST /images**: Store an image by providing a URL in the request body.
  - Request Body:
    ```json
    {
      "url": "https://example.com/image.jpg"
    }
    ```
  - Response:
    ```json
    {
      "id": "unique-image-id"
    }
    ```

- **GET /images/:id**: Retrieve a stored image using its unique ID.
  - Response:
    ```json
    {
      "id": "unique-image-id",
      "url": "https://example.com/image.jpg",
      "timestamp": "2023-01-01T00:00:00Z"
    }
    ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.