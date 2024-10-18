import React from 'react';
import { MastodonPost } from '../types/MastodonPost';
import { formatDistanceToNow } from 'date-fns';
import { Image } from 'lucide-react';

interface PostListProps {
  posts: MastodonPost[];
}

const PostList: React.FC<PostListProps> = ({ posts }) => {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center mb-2">
            <img
              src={post.account.avatar}
              alt={post.account.display_name}
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <h3 className="font-semibold">{post.account.display_name}</h3>
              <p className="text-sm text-gray-500">@{post.account.username}</p>
            </div>
            <span className="ml-auto text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="mb-2" dangerouslySetInnerHTML={{ __html: post.content }} />
          {post.media_attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.media_attachments.map((media, index) => (
                media.type === 'image' ? (
                  <img
                    key={index}
                    src={media.url}
                    alt="Media attachment"
                    className="max-w-full h-auto rounded"
                  />
                ) : (
                  <div key={index} className="flex items-center justify-center bg-gray-200 rounded w-16 h-16">
                    <Image className="w-8 h-8 text-gray-500" />
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PostList;