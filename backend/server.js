import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fetch from 'node-fetch';
import WebSocket from 'ws';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const MASTODON_SERVER = process.env.MASTODON_SERVER || 'https://mastodon.social';
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;

const fetchInitialPosts = async () => {
  try {
    const response = await fetch(`${MASTODON_SERVER}/api/v1/timelines/public?limit=20`);
    const posts = await response.json();
    return posts;
  } catch (error) {
    console.error('Error fetching initial posts:', error);
    return [];
  }
};

const streamMastodonPosts = (retryCount = 0) => {
  const ws = new WebSocket(`${MASTODON_SERVER}/api/v1/streaming/public`);

  ws.on('open', () => {
    console.log('Connected to Mastodon streaming API');
    retryCount = 0; // Reset retry count on successful connection
  });

  ws.on('message', async (data) => {
    try {
      const event = JSON.parse(data);
      if (event.event === 'update') {
        const post = JSON.parse(event.payload);
        io.emit('mastodon_post', post);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', (code, reason) => {
    console.log(`WebSocket connection closed. Code: ${code}, Reason: ${reason}`);
    
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`Attempting to reconnect in ${delay}ms...`);
      setTimeout(() => streamMastodonPosts(retryCount + 1), delay);
    } else {
      console.log('Max retries reached. Falling back to polling.');
      startPolling();
    }
  });
};

const startPolling = () => {
  setInterval(async () => {
    try {
      const posts = await fetchInitialPosts();
      posts.forEach(post => io.emit('mastodon_post', post));
    } catch (error) {
      console.error('Error during polling:', error);
    }
  }, 60000); // Poll every minute
};

io.on('connection', async (socket) => {
  console.log('A user connected');
  const initialPosts = await fetchInitialPosts();
  socket.emit('initial_posts', initialPosts);
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

httpServer.listen(3000, () => {
  console.log('Server is running on port 3000');
  streamMastodonPosts();
});