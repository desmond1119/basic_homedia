import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { 
  fetchPostById, 
  fetchComments, 
  clearSelectedPost,
  toggleLike,
  toggleBookmark,
  toggleRepost,
  createComment
} from '../store/forumSlice';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
  BookmarkIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  FaceSmileIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid
} from '@heroicons/react/24/solid';

interface Comment {
  id: string;
  userId: string;
  username: string;
  userFullName: string;
  userAvatar?: string;
  content: string;
  mediaUrls: string[];
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  parentId?: string;
  replies?: Comment[];
}

const CommentItem = ({ 
  comment, 
  onReply,
  depth = 0 
}: { 
  comment: Comment; 
  onReply: (commentId: string, username: string) => void;
  depth?: number;
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [showReplies, setShowReplies] = useState(true);
  const navigate = useNavigate();

  const handleLike = async () => {
    if (!user) {
      toast.error(t('auth.loginRequired'));
      return;
    }
    
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
    await dispatch(toggleLike({
      userId: user.id,
      targetId: comment.id,
      targetType: 'comment',
      currentlyLiked: isLiked
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${depth > 0 ? 'ml-12 border-l-2 border-gray-100 pl-4' : ''}`}
    >
      <div className="flex gap-3 mb-4">
        <img
          src={comment.userAvatar || `https://ui-avatars.com/api/?name=${comment.username}&background=ef4444&color=fff`}
          alt={comment.username}
          className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-red-500 transition-all"
          onClick={() => navigate(`/profile/${comment.userId}`)}
        />
        <div className="flex-1">
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-900">{comment.userFullName || comment.username}</span>
              <span className="text-xs text-gray-500">@{comment.username}</span>
              <span className="text-xs text-gray-400">• {new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            
            {comment.mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {comment.mediaUrls.map((url, i) => (
                  <img key={i} src={url} alt="" className="rounded-lg w-full" />
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-2 ml-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-sm transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              {isLiked ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
              <span>{likeCount}</span>
            </button>
            
            <button
              onClick={() => onReply(comment.id, comment.username)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors"
            >
              <ChatBubbleLeftIcon className="w-4 h-4" />
              <span>{t('forum.comment.reply')}</span>
            </button>
            
            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showReplies ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                <span>{comment.replies.length} {t('forum.comment.replies')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export const PostDetailPageEnhanced = () => {
  const { t } = useTranslation();
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedPost, comments, fetchPost, fetchComments: fetchCommentsState } = useAppSelector((state) => state.forum);
  const { user } = useAppSelector((state) => state.auth);
  
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [repostCount, setRepostCount] = useState(0);
  
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (postId) {
      void dispatch(fetchPostById(postId));
      void dispatch(fetchComments(postId));
    }

    return () => {
      dispatch(clearSelectedPost());
    };
  }, [dispatch, postId]);

  useEffect(() => {
    if (selectedPost) {
      setIsLiked(selectedPost.isLiked || false);
      setIsBookmarked(selectedPost.isBookmarked || false);
      setIsReposted(selectedPost.isReposted || false);
      setLikeCount(selectedPost.likeCount || 0);
      setCommentCount(selectedPost.commentCount || 0);
      setRepostCount(selectedPost.repostCount || 0);
    }
  }, [selectedPost]);

  const handleLike = async () => {
    if (!user) {
      toast.error(t('auth.loginRequired'));
      return;
    }
    
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
    await dispatch(toggleLike({
      userId: user.id,
      targetId: postId!,
      targetType: 'post',
      currentlyLiked: isLiked
    }));
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.error(t('auth.loginRequired'));
      return;
    }
    
    setIsBookmarked(!isBookmarked);
    
    await dispatch(toggleBookmark({
      userId: user.id,
      postId: postId!,
      currentlyBookmarked: isBookmarked
    }));
    
    toast.success(isBookmarked ? t('forum.post.unbookmarked') : t('forum.post.bookmarked'));
  };

  const handleRepost = async () => {
    if (!user) {
      toast.error(t('auth.loginRequired'));
      return;
    }
    
    setIsReposted(!isReposted);
    setRepostCount(prev => isReposted ? prev - 1 : prev + 1);
    
    await dispatch(toggleRepost({
      userId: user.id,
      postId: postId!,
      currentlyReposted: isReposted
    }));
    
    toast.success(isReposted ? t('forum.post.unreposted') : t('forum.post.reposted'));
  };

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t('forum.post.linkCopied'));
    setShowShareMenu(false);
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error(t('auth.loginRequired'));
      return;
    }
    
    if (!commentText.trim()) {
      toast.error(t('forum.comment.empty'));
      return;
    }
    
    setIsSubmittingComment(true);
    
    try {
      await dispatch(createComment({
        userId: user.id,
        data: {
          postId: postId!,
          content: commentText,
          parentId: replyTo?.id
        }
      }));
      
      setCommentText('');
      setReplyTo(null);
      setCommentCount(prev => prev + 1);
      toast.success(t('forum.comment.posted'));
      
      // Refresh comments
      void dispatch(fetchComments(postId!));
    } catch (error) {
      toast.error(t('forum.comment.error'));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyTo({ id: commentId, username });
    setCommentText(`@${username} `);
    // Scroll to comment input
    document.getElementById('comment-input')?.focus();
  };

  if (fetchPost.status === 'pending') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gray-200 border-t-red-500 rounded-full"
        />
      </div>
    );
  }

  if (!selectedPost) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('forum.post.notFound')}</h2>
          <button
            onClick={() => navigate('/forum')}
            className="text-red-500 hover:text-red-600 transition-colors font-medium"
          >
            {t('common.backToForum')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -4 }}
            onClick={() => navigate('/forum')}
            className="flex items-center gap-2 py-6 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="font-medium">{t('common.backToForum')}</span>
          </motion.button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Post Content */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-200 overflow-hidden"
        >
          {/* Author Info */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={selectedPost.userAvatar || `https://ui-avatars.com/api/?name=${selectedPost.username}&background=ef4444&color=fff`}
                  alt={selectedPost.username}
                  className="w-14 h-14 rounded-full cursor-pointer hover:ring-4 hover:ring-red-100 transition-all"
                  onClick={() => navigate(`/profile/${selectedPost.userId}`)}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-gray-900">
                      {selectedPost.userFullName || selectedPost.username}
                    </h3>
                    <span className="text-gray-500">@{selectedPost.username}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {selectedPost.categoryName}
                    </span>
                  </div>
                </div>
              </div>
              
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <EllipsisHorizontalIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Post Title & Content */}
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedPost.title}</h1>
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
            
            {/* Tags */}
            {selectedPost.tags && selectedPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {selectedPost.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-red-50 text-red-600 text-sm rounded-full hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Media */}
            {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {selectedPost.mediaUrls.map((url, i) => (
                  <motion.img
                    key={i}
                    src={url}
                    alt=""
                    className="rounded-2xl w-full cursor-pointer hover:scale-105 transition-transform"
                    whileHover={{ scale: 1.02 }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Interaction Bar */}
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    isLiked 
                      ? 'bg-red-50 text-red-500' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {isLiked ? <HeartSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                  <span className="font-medium">{likeCount}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all"
                >
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  <span className="font-medium">{commentCount}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRepost}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    isReposted 
                      ? 'bg-green-50 text-green-500' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span className="font-medium">{repostCount}</span>
                </motion.button>
              </div>

              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBookmark}
                  className={`p-2 rounded-full transition-all ${
                    isBookmarked 
                      ? 'bg-blue-50 text-blue-500' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {isBookmarked ? <BookmarkSolid className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />}
                </motion.button>

                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all"
                  >
                    <ShareIcon className="w-5 h-5" />
                  </motion.button>
                  
                  <AnimatePresence>
                    {showShareMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10"
                      >
                        <button
                          onClick={handleCopyLink}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700"
                        >
                          {t('forum.post.copyLink')}
                        </button>
                        <button className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700">
                          {t('forum.post.shareTwitter')}
                        </button>
                        <button className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700">
                          {t('forum.post.shareFacebook')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.article>

        {/* Comment Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 bg-white rounded-3xl border border-gray-200 p-6"
        >
          {replyTo && (
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
              <span>{t('forum.comment.replyingTo')} @{replyTo.username}</span>
              <button
                onClick={() => {
                  setReplyTo(null);
                  setCommentText('');
                }}
                className="text-red-500 hover:text-red-600"
              >
                {t('common.cancel')}
              </button>
            </div>
          )}
          
          <div className="flex gap-4">
            {user ? (
              <>
                <img
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=ef4444&color=fff`}
                  alt={user.username}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <textarea
                    id="comment-input"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t('forum.comment.placeholder')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <PhotoIcon className="w-5 h-5 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <FaceSmileIcon className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      {isSubmittingComment ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <PaperAirplaneIcon className="w-4 h-4" />
                      )}
                      <span>{t('forum.comment.post')}</span>
                    </motion.button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 text-center py-8">
                <p className="text-gray-500 mb-4">{t('forum.comment.loginToComment')}</p>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors font-medium"
                >
                  {t('auth.loginText')}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {t('forum.comment.title')} ({commentCount})
          </h3>
          
          {fetchCommentsState.status === 'pending' ? (
            <div className="flex justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-4 border-gray-200 border-t-red-500 rounded-full"
              />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment as any}
                  onReply={handleReply}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-3xl">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-gray-500">{t('forum.comment.noComments')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('forum.comment.beFirst')}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
