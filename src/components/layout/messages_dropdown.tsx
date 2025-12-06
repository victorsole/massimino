'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ChatRoom {
  id: string;
  name?: string;
  type: string;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    senderName?: string;
  };
  participants: {
    userId: string;
    userName?: string;
    userImage?: string;
  }[];
  unreadCount: number;
  updatedAt: string;
}

interface MessagesDropdownProps {
  userId?: string;
}

export function MessagesDropdown({ userId }: MessagesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchConversations();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchConversations = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/notifications?type=conversations&limit=10');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);

        const unread = data.conversations?.reduce((sum: number, conv: ChatRoom) => sum + conv.unreadCount, 0) || 0;
        setTotalUnread(unread);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getConversationName = (conversation: ChatRoom) => {
    if (conversation.name) {
      return conversation.name;
    }

    if (conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants.find(p => p.userId !== userId);
      return otherParticipant?.userName || 'Unknown User';
    }

    return 'Group Chat';
  };

  const getConversationAvatar = (conversation: ChatRoom) => {
    if (conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants.find(p => p.userId !== userId);
      return otherParticipant?.userImage;
    }
    return null;
  };

  const truncateMessage = (content: string, maxLength = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleConversationClick = (conversationId: string) => {
    setIsOpen(false);
    // Navigate to the conversation page
    window.location.href = `/messages/${conversationId}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageCircle className="h-5 w-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Messages</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.map((conversation) => {
                  const avatarUrl = getConversationAvatar(conversation);
                  const conversationName = getConversationName(conversation);

                  return (
                    <div
                      key={conversation.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer ${
                        conversation.unreadCount > 0 ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleConversationClick(conversation.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={conversationName}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              {conversation.type === 'GROUP' ? (
                                <span className="text-lg">👥</span>
                              ) : (
                                <User className="h-5 w-5 text-gray-600" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversationName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {conversation.lastMessage
                                ? formatTime(conversation.lastMessage.createdAt)
                                : formatTime(conversation.updatedAt)
                              }
                            </p>
                          </div>

                          {conversation.lastMessage && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {conversation.lastMessage.senderId === userId ? 'You: ' : ''}
                              {truncateMessage(conversation.lastMessage.content)}
                            </p>
                          )}

                          {conversation.type === 'GROUP' && (
                            <p className="text-xs text-gray-400 mt-1">
                              {conversation.participants.length} participants
                            </p>
                          )}
                        </div>

                        {conversation.unreadCount > 0 && (
                          <div className="flex items-center">
                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {conversations.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/messages';
                }}
              >
                View all messages
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}