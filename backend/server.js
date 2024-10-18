import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fetch from 'node-fetch';
import WebSocket from 'ws';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket']
});

const MASTODON_SERVER = process.env.MASTODON_SERVER || 'https://mastodon.social';
const ACCESS_TOKEN = process.env.MASTODON_ACCESS_TOKEN;
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;

const fetchInitialPosts = async () => {
  try {
    const response = await fetch(`${MASTODON_SERVER}/api/v1/timelines/public?limit=20`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const posts = await response.json();
    return posts;
  } catch (error) {
    console.error('Error fetching initial posts:', error);
    return [];
  }
};

const getWebSocketUrl = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        getWebSocketUrl(res.headers.location).then(resolve).catch(reject);
      } else if (res.statusCode === 200) {
        resolve(url.replace('https://', 'wss://'));
      } else {
        reject(new Error(`Unexpected status code: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
};

const streamMastodonPosts = async (retryCount = 0) => {
  try {
    const wsUrl = await getWebSocketUrl(`${MASTODON_SERVER}/api/v1/streaming/public?stream=public`);
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl, {
      headers: {
        'User-Agent': 'MastodonStreamApp/1.0.0',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });

    ws.on('open', () => {
      console.log('Connected to Mastodon streaming API');
      retryCount = 0; // Reset retry count on successful connection
    });

    ws.on('message', async (data) => {
      try {
        console.log('Got new message!');
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
  } catch (error) {
    console.error('Error setting up WebSocket connection:', error);
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`Attempting to reconnect in ${delay}ms...`);
      setTimeout(() => streamMastodonPosts(retryCount + 1), delay);
    } else {
      console.log('Max retries reached. Falling back to polling.');
      startPolling();
    }
  }
};

const startPolling = () => {
  setInterval(async () => {
    try {
      const posts = await fetchInitialPosts();
      posts.forEach(post => io.emit('mastodon_post', post));
    } catch (error) {
      console.error('Error during polling:', error);
    }
  }, 10000); // Poll every 10 seconds
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
  if (!ACCESS_TOKEN) {
    console.error('MASTODON_ACCESS_TOKEN is not set. Please set it in the .env file.');
  } else {
    streamMastodonPosts();
  }
});