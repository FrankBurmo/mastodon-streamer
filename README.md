# Mastodon Stream Application

This project is a real-time Mastodon post streaming application built with React, TypeScript, and Node.js. It uses WebSockets to stream public posts from a Mastodon instance in near real-time, with a fallback to polling if WebSocket connection fails.

![image](https://github.com/user-attachments/assets/b1162631-bf7c-4c6d-81a7-a47ad8923e3e)


## Architecture

The application consists of two main components:

1. Frontend: A React application built with Vite, TypeScript, and Tailwind CSS.
2. Backend: A Node.js server using Express and Socket.IO to stream Mastodon posts.

Both components are containerized using Docker for easy deployment and scaling.

## Features

- Real-time streaming of public Mastodon posts
- Fallback to polling if WebSocket connection fails
- Responsive design using Tailwind CSS
- Error handling and display of connection status
- Dockerized frontend and backend for easy deployment
- Scalable architecture

## Prerequisites

- Docker
- Docker Compose

## Environment variables for the backend

```
MASTODON_SERVER=https://mastodon.social
MASTODON_ACCESS_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX <--- Use your own token
```

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/FrankBurmo/mastodon-streamer.git
   cd mastodon-streamer
   ```

2. Build and run the application using Docker Compose:
   ```
   docker-compose up --build
   ```

3. Open your browser and navigate to `http://localhost:80` to view the application.

## Development

To run the application in development mode:

1. Start the backend:
   ```
   cd backend
   npm install
   npm start
   ```

2. In a new terminal, start the frontend:
   ```
   npm install
   npm run dev
   ```

3. Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## Deployment

The application is ready for deployment using Docker. You can deploy it to any cloud platform that supports Docker containers, such as Azure, AWS ECS, Google Cloud Run, or DigitalOcean App Platform.

## Error Handling

The application implements robust error handling:

- The backend uses a retry mechanism with exponential backoff for WebSocket connections.
- If WebSocket connection fails repeatedly, the backend falls back to polling the Mastodon API.
- The frontend displays connection status and error messages to the user.

## Future Improvements

- Add search functionality
- Improve error handling and reconnection logic
- Implement caching for better performance
- Add unit and integration tests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
