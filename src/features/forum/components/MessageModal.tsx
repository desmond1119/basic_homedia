/**
 * Message Modal
 * Private messaging interface
 */

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchConversationWith, sendMessage, clearCurrentConversation } from '../store/messageSlice';

interface MessageModalProps {
  recipientId: string;
  recipientName: string;
  onClose: () => void;
}

export const MessageModal = ({ recipientId, recipientName, onClose }: MessageModalProps) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentConversation, sendMessage: sendMessageState } = useAppSelector((state) => state.messages);
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    if (user) {
      void dispatch(fetchConversationWith({ userId: user.id, otherUserId: recipientId }));
    }

    return () => {
      dispatch(clearCurrentConversation());
    };
  }, [dispatch, user, recipientId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !messageContent.trim()) return;

    const result = await dispatch(sendMessage({
      senderId: user.id,
      data: {
        receiverId: recipientId,
        content: messageContent,
      },
    }));

    if (sendMessage.fulfilled.match(result)) {
      setMessageContent('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex items-end justify-center min-h-screen p-4 sm:items-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

        <div className="relative bg-white rounded-2xl w-full max-w-lg h-[600px] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{recipientName}</h2>
              <p className="text-sm text-gray-500">Direct Message</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {currentConversation.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                No messages yet. Start a conversation!
              </div>
            ) : (
              currentConversation.map((msg) => {
                const isSent = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isSent
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isSent ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!messageContent.trim() || sendMessageState.status === 'pending'}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
