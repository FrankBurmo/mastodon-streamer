import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import PostList from './components/PostList';
import { MastodonPost } from './types/MastodonPost';
import { RefreshCw, AlertCircle } from 'lucide-react';

const WEBSOCKET_URL = 'http://localhost:3000';

function App() {
  const [posts, setPosts] = useState<MastodonPost[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = io(WEBSOCKET_URL);

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
      setError('Disconnected from server. Attempting to reconnect...');
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError(`Connection error: ${err.message}`);
    });

    socket.on('initial_posts', (initialPosts: MastodonPost[]) => {
      setPosts(initialPosts);
    });

    socket.on('mastodon_post', (post: MastodonPost) => {
      setPosts((prevPosts) => [post, ...prevPosts.slice(0, 99)]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Mastodon Stream</h1>
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCw className="w-12 h-12 text-gray-400 animate-spin" />
            <p className="mt-4 text-gray-600">Waiting for posts...</p>
          </div>
        ) : (
          <PostList posts={posts} />
        )}
      </main>
    </div>
  );
}

export default App;