import { motion } from 'framer-motion';
import { PostCard } from './PostCard';
import { Post } from '../domain/Forum.types';

interface PostGridProps {
  posts: Post[];
  viewMode: 'grid' | 'list';
}

export const PostGrid = ({ posts, viewMode }: PostGridProps) => {
  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6'}>
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} index={index} />
      ))}
    </div>
  );
};
