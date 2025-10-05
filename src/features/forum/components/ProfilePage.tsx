/**
 * Profile Page
 * User profile with posts, followers, and stats
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import {
  fetchUserProfile,
  fetchUserPosts,
  toggleFollow,
  clearSelectedProfile,
} from '../store/profileSlice';
import { PostCard } from './PostCard';
import { MessageModal } from './MessageModal';

export const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedProfile, userPosts, fetchProfile } = useAppSelector((state) => state.profile);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');

  useEffect(() => {
    if (userId) {
      void dispatch(fetchUserProfile({ userId, currentUserId: currentUser?.id }));
      void dispatch(fetchUserPosts({ userId }));
    }

    return () => {
      dispatch(clearSelectedProfile());
    };
  }, [dispatch, userId, currentUser?.id]);

  const handleFollow = async () => {
    if (!currentUser || !selectedProfile) return;

    await dispatch(toggleFollow({
      followerId: currentUser.id,
      followedId: selectedProfile.id,
      currentlyFollowing: selectedProfile.isFollowing || false,
    }));
  };

  if (fetchProfile.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <button
            onClick={() => navigate('/forum')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to forum
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === selectedProfile.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/forum')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          {/* Profile Header */}
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {selectedProfile.avatarUrl ? (
                <img
                  src={selectedProfile.avatarUrl}
                  alt={selectedProfile.username}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {selectedProfile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedProfile.fullName || selectedProfile.username}
              </h1>
              <p className="text-gray-600">@{selectedProfile.username}</p>

              {selectedProfile.bio && (
                <p className="mt-2 text-gray-700">{selectedProfile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 mt-4">
                <div>
                  <span className="font-bold text-gray-900">{selectedProfile.postCount}</span>
                  <span className="text-gray-600 ml-1">Posts</span>
                </div>
                <button
                  onClick={() => setActiveTab('followers')}
                  className="hover:underline"
                >
                  <span className="font-bold text-gray-900">{selectedProfile.followerCount}</span>
                  <span className="text-gray-600 ml-1">Followers</span>
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className="hover:underline"
                >
                  <span className="font-bold text-gray-900">{selectedProfile.followingCount}</span>
                  <span className="text-gray-600 ml-1">Following</span>
                </button>
              </div>

              {/* Actions */}
              {!isOwnProfile && currentUser && (
                <div className="flex items-center space-x-3 mt-4">
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-lg font-medium transition ${
                      selectedProfile.isFollowing
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {selectedProfile.isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-4 border-b-2 font-medium transition ${
                activeTab === 'posts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`py-4 border-b-2 font-medium transition ${
                activeTab === 'followers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Followers
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`py-4 border-b-2 font-medium transition ${
                activeTab === 'following'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Following
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {userPosts.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No posts yet</p>
            ) : (
              userPosts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="text-center text-gray-500 py-12">
            Followers list coming soon
          </div>
        )}

        {activeTab === 'following' && (
          <div className="text-center text-gray-500 py-12">
            Following list coming soon
          </div>
        )}
      </div>

      {/* Message Modal */}
      {showMessageModal && selectedProfile && (
        <MessageModal
          recipientId={selectedProfile.id}
          recipientName={selectedProfile.username}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </div>
  );
};
