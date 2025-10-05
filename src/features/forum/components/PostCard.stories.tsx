import type { Meta, StoryObj } from '@storybook/react';
import { PostCard } from './PostCard.new';
import { Post } from '../domain/Forum.types';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';

const mockStore = configureStore({
  reducer: {
    auth: () => ({ user: { id: '1', username: 'testuser' }, isAuthenticated: true }),
  },
});

const mockPost: Post = {
  id: '1',
  userId: '1',
  username: 'johndoe',
  userFullName: 'John Doe',
  userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  categoryId: '1',
  categoryName: '裝修問答',
  title: 'How to choose the right interior designer?',
  content: 'I am looking for an interior designer for my new apartment. What should I consider when making my choice? Budget is around HKD 50,000.',
  tags: ['interior', 'design', 'budget'],
  mediaUrls: [
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400',
  ],
  likeCount: 42,
  commentCount: 15,
  repostCount: 8,
  isLiked: false,
  isBookmarked: false,
  isReposted: false,
  createdAt: new Date('2024-01-15').toISOString(),
  updatedAt: new Date('2024-01-15').toISOString(),
};

const meta: Meta<typeof PostCard> = {
  title: 'Forum/PostCard',
  component: PostCard,
  decorators: [
    (Story) => (
      <Provider store={mockStore}>
        <BrowserRouter>
          <div className="bg-black p-8">
            <Story />
          </div>
        </BrowserRouter>
      </Provider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PostCard>;

export const Default: Story = {
  args: {
    post: mockPost,
    index: 0,
  },
};

export const Liked: Story = {
  args: {
    post: { ...mockPost, isLiked: true, likeCount: 43 },
    index: 0,
  },
};

export const WithoutMedia: Story = {
  args: {
    post: { ...mockPost, mediaUrls: [] },
    index: 0,
  },
};

export const WithManyTags: Story = {
  args: {
    post: {
      ...mockPost,
      tags: ['interior', 'design', 'budget', 'renovation', 'tips', 'advice'],
    },
    index: 0,
  },
};

export const LongContent: Story = {
  args: {
    post: {
      ...mockPost,
      content: 'This is a very long post content that should be truncated after three lines. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    },
    index: 0,
  },
};
