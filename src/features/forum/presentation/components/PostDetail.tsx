import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  X,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Share2,
  Bookmark,
  Flag,
  Send,
  Reply,
} from 'lucide-react';
import { type RootState, type AppDispatch } from '@/core/store/store';
import {
  upvoteThunk,
  downvoteThunk,
  reportPostThunk,
  fetchCommentsThunk,
  createCommentThunk,
  ForumPost,
  ForumComment,
} from '../../infrastructure/ForumThunks';

interface PostDetailProps {
  post: ForumPost;
  onClose: () => void;
}

const CommentItem: React.FC<{
  comment: ForumComment;
  postId: string;
  depth?: number;
}> = ({ comment, postId, depth = 0 }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    
    await dispatch(createCommentThunk({
      postId,
      content: replyContent,
      parentId: comment.id,
    }));
    
    setReplyContent('');
    setShowReplyForm(false);
  };

  const handleUpvote = async () => {
    if (userVote === 'upvote') {
      setUserVote(null);
    } else {
      setUserVote('upvote');
      await dispatch(upvoteThunk({ targetId: comment.id, targetType: 'comment' }));
    }
  };

  const handleDownvote = async () => {
    if (userVote === 'downvote') {
      setUserVote(null);
    } else {
      setUserVote('downvote');
      await dispatch(downvoteThunk({ targetId: comment.id, targetType: 'comment' }));
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-4"
      >
        {/* Comment Header */}
        <div className="flex items-start gap-3">
          {comment.avatar_url ? (
            <img
              src={comment.avatar_url}
              alt={comment.username}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex-shrink-0" />
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">
                {comment.display_name || comment.username}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <p className="text-gray-700 mb-3">{comment.content}</p>
            
            {/* Comment Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUpvote}
                  className={`p-1 rounded transition-colors ${
                    userVote === 'upvote' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'
                  }`}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 min-w-[20px] text-center">
                  {comment.upvote_count - comment.downvote_count}
                </span>
                <button
                  onClick={handleDownvote}
                  className={`p-1 rounded transition-colors ${
                    userVote === 'downvote' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-sm text-gray-500 hover:text-blue-500 transition-colors flex items-center gap-1"
              >
                <Reply className="w-4 h-4" />
                {t('forum.reply')}
              </button>
              
              <button className="text-gray-400 hover:text-gray-600">
                <Flag className="w-4 h-4" />
              </button>
            </div>
            
            {/* Reply Form */}
            <AnimatePresence>
              {showReplyForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                      placeholder={t('forum.replyPlaceholder')}
                      className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-300"
                    />
                    <button
                      onClick={handleReply}
                      className="px-4 py-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      
      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PostDetail: React.FC<PostDetailProps> = ({ post, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const comments = useSelector((state: RootState) => state.forum.comments[post.id] || []);
  const [commentContent, setCommentContent] = useState('');
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);

  useEffect(() => {
    dispatch(fetchCommentsThunk(post.id));
  }, [dispatch, post.id]);

  const handleUpvote = async () => {
    if (userVote === 'upvote') {
      setUserVote(null);
    } else {
      setUserVote('upvote');
      await dispatch(upvoteThunk({ targetId: post.id, targetType: 'post' }));
    }
  };

  const handleDownvote = async () => {
    if (userVote === 'downvote') {
      setUserVote(null);
    } else {
      setUserVote('downvote');
      await dispatch(downvoteThunk({ targetId: post.id, targetType: 'post' }));
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim()) return;
    
    await dispatch(createCommentThunk({
      postId: post.id,
      content: commentContent,
    }));
    
    setCommentContent('');
  };

  const handleReport = async () => {
    const reason = prompt(t('forum.reportReason'));
    if (reason) {
      await dispatch(reportPostThunk({ targetId: post.id, targetType: 'post', reason }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
          
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
            <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <Bookmark className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={handleReport}
              className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <Flag className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-32 overflow-y-auto max-h-[calc(100vh-60px)]">
        {/* Post Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Category & Tags */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-gradient-to-r from-pink-400 to-purple-400 text-white text-xs font-medium rounded-full">
              {post.category}
            </span>
            {post.tags?.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          {/* Author Info */}
          <div className="flex items-center gap-3 mb-6">
            {post.avatar_url ? (
              <img
                src={post.avatar_url}
                alt={post.username}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full" />
            )}
            <div>
              <p className="font-medium text-gray-900">
                {post.display_name || post.username}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mb-6 space-y-4">
              {post.media_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Media ${index + 1}`}
                  className="w-full rounded-xl"
                />
              ))}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-gray max-w-none mb-8">
            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Interaction Bar */}
          <div className="flex items-center justify-between py-4 border-y border-gray-100 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-gray-50 rounded-full px-3 py-1.5">
                <button
                  onClick={handleUpvote}
                  className={`p-1 rounded-full transition-colors ${
                    userVote === 'upvote' ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
                  }`}
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <span className="font-medium text-gray-700 min-w-[30px] text-center">
                  {post.score || 0}
                </span>
                <button
                  onClick={handleDownvote}
                  className={`p-1 rounded-full transition-colors ${
                    userVote === 'downvote' ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-1 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">{post.comment_count || 0}</span>
                <span className="text-sm">{t('forum.comments')}</span>
              </div>
            </div>
          </div>

          {/* Comment Input */}
          <div className="mb-8">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder={t('forum.commentPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleComment}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {t('forum.postComment')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('forum.comments')} ({comments.length})
            </h3>
            {comments.map((comment: ForumComment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={post.id}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PostDetail;
