'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Search,
  Plus,
  Users,
  User,
  Send,
  MoreHorizontal,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Phone,
  Video,
  Paperclip
} from 'lucide-react';
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

export default function MessagesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<ChatRoom[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    fetchConversations();
  }, [session, router]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/notifications?type=conversations&limit=20');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);

        // Auto-select first conversation if available
        if (data.conversations?.length > 0 && !selectedConversation) {
          setSelectedConversation(data.conversations[0]);
          fetchMessages(data.conversations[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      // Enhanced mock messages with more realistic fitness conversations
      const mockMessageSets: { [key: string]: any[] } = {
        '1': [
          {
            id: '1',
            content: 'Hey! How was your workout today?',
            senderId: 'other-user-1',
            senderName: 'Alex Johnson',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            content: 'It was amazing! I finally hit my goal of bench pressing 1.5x my body weight 🎯',
            senderId: session?.user?.id || '',
            senderName: 'You',
            createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            content: 'That\'s incredible! What\'s your next goal? 💪',
            senderId: 'other-user-1',
            senderName: 'Alex Johnson',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '4',
            content: 'I\'m thinking of working on my deadlift next. Want to be my accountability partner?',
            senderId: session?.user?.id || '',
            senderName: 'You',
            createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '5',
            content: 'Absolutely! Let\'s set up a deadlift challenge. I\'ll create a shared workout plan on Massimino 📝',
            senderId: 'other-user-1',
            senderName: 'Alex Johnson',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          },
        ],
        '2': [
          {
            id: '1',
            content: 'Welcome to the Fitness Motivation Group! 🏋️‍♀️',
            senderId: 'trainer-1',
            senderName: 'Sarah Coach',
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            content: 'This week\'s challenge: Complete 150 minutes of cardio! Who\'s in? 🏃‍♂️',
            senderId: 'trainer-1',
            senderName: 'Sarah Coach',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            content: 'I\'m in! Already did 45 minutes on the treadmill this morning 🏃‍♀️',
            senderId: 'other-user-2',
            senderName: 'Emma Fitness',
            createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '4',
            content: 'Count me in too! Planning a long bike ride this weekend 🚴‍♂️',
            senderId: session?.user?.id || '',
            senderName: 'You',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '5',
            content: 'Great energy everyone! Remember to track your workouts in the app 📱',
            senderId: 'trainer-1',
            senderName: 'Sarah Coach',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
        ],
      };

      const roomMessages = mockMessageSets[roomId] || mockMessageSets['1'];
      setMessages(roomMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const tempMessage = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: session?.user?.id || '',
      senderName: session?.user?.name || 'You',
      createdAt: new Date().toISOString(),
      status: 'sending' as const,
    };

    setMessages(prev => [...prev, tempMessage]);
    const messageToSend = newMessage;
    setNewMessage('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update message status to sent
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempMessage.id
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      );

      // Update the conversation's last message
      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: {
                  id: tempMessage.id,
                  content: messageToSend,
                  createdAt: tempMessage.createdAt,
                  senderId: tempMessage.senderId,
                  senderName: tempMessage.senderName,
                },
                updatedAt: tempMessage.createdAt,
              }
            : conv
        )
      );

      // Here you would send the message to the real API
      // await sendMessageToAPI(selectedConversation.id, messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Update message status to failed
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempMessage.id
            ? { ...msg, status: 'failed' as const }
            : msg
        )
      );
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleConversationSelect = (conversation: ChatRoom) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getConversationName = (conversation: ChatRoom) => {
    if (conversation.name) {
      return conversation.name;
    }
    if (conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants.find(p => p.userId !== session?.user?.id);
      return otherParticipant?.userName || 'Unknown User';
    }
    return 'Group Chat';
  };

  const getConversationAvatar = (conversation: ChatRoom) => {
    if (conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants.find(p => p.userId !== session?.user?.id);
      return otherParticipant?.userImage;
    }
    return null;
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-brand-primary mx-auto mb-4" />
              <p className="text-brand-primary">Loading conversations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-primary mb-2">Messages</h1>
          <p className="text-brand-primary-light">Stay connected with your fitness community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Conversations</CardTitle>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No conversations yet</p>
                    <p className="text-sm">Start a new conversation to get started!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredConversations.map((conversation) => {
                      const avatarUrl = getConversationAvatar(conversation);
                      const conversationName = getConversationName(conversation);
                      const isSelected = selectedConversation?.id === conversation.id;

                      return (
                        <div
                          key={conversation.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-brand-primary-light/10 border-r-2 border-brand-primary' : ''
                          }`}
                          onClick={() => handleConversationSelect(conversation)}
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
                                    <Users className="h-5 w-5 text-gray-600" />
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
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  {conversation.lastMessage.senderId === session?.user?.id ? 'You: ' : ''}
                                  {conversation.lastMessage.content}
                                </p>
                              )}

                              <div className="flex items-center justify-between mt-1">
                                {conversation.type === 'GROUP' && (
                                  <p className="text-xs text-gray-400">
                                    {conversation.participants.length} participants
                                  </p>
                                )}
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="default" className="bg-brand-primary">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b bg-gradient-to-r from-brand-secondary to-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 relative">
                          {getConversationAvatar(selectedConversation) ? (
                            <Image
                              src={getConversationAvatar(selectedConversation)!}
                              alt={getConversationName(selectedConversation)}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center">
                              {selectedConversation.type === 'GROUP' ? (
                                <Users className="h-5 w-5 text-brand-primary" />
                              ) : (
                                <User className="h-5 w-5 text-brand-primary" />
                              )}
                            </div>
                          )}
                          {selectedConversation.type === 'DIRECT' && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-brand-primary">
                            {getConversationName(selectedConversation)}
                          </h3>
                          {selectedConversation.type === 'GROUP' ? (
                            <p className="text-sm text-brand-primary-light">
                              {selectedConversation.participants.length} participants
                            </p>
                          ) : (
                            <p className="text-sm text-green-600">Online</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedConversation.type === 'DIRECT' && (
                          <>
                            <Button variant="ghost" size="sm" className="text-brand-primary hover:bg-brand-primary/10">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-brand-primary hover:bg-brand-primary/10">
                              <Video className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" className="text-brand-primary hover:bg-brand-primary/10">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="p-0 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
                    <div className="p-4 space-y-4">
                      {messages.map((message, index) => {
                        const isOwnMessage = message.senderId === session?.user?.id;
                        const showAvatar = !isOwnMessage && selectedConversation.type === 'GROUP';
                        const prevMessage = index > 0 ? messages[index - 1] : null;
                        const isGrouped = prevMessage && prevMessage.senderId === message.senderId;

                        const getStatusIcon = () => {
                          if (!isOwnMessage) return null;

                          switch (message.status) {
                            case 'sending':
                              return <Clock className="h-3 w-3 text-white/60" />;
                            case 'sent':
                              return <Check className="h-3 w-3 text-white/60" />;
                            case 'delivered':
                              return <CheckCheck className="h-3 w-3 text-white/60" />;
                            case 'read':
                              return <CheckCheck className="h-3 w-3 text-blue-300" />;
                            case 'failed':
                              return <AlertCircle className="h-3 w-3 text-red-300" />;
                            default:
                              return <Check className="h-3 w-3 text-white/60" />;
                          }
                        };

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                              isGrouped ? 'mt-1' : 'mt-4'
                            }`}
                          >
                            {showAvatar && !isGrouped && (
                              <div className="w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center mr-2 flex-shrink-0 self-end">
                                <span className="text-xs font-medium text-brand-primary">
                                  {message.senderName?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            {showAvatar && isGrouped && <div className="w-8 mr-2"></div>}

                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                isOwnMessage
                                  ? 'bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white'
                                  : 'bg-white text-gray-900 border border-gray-100'
                              } ${
                                isOwnMessage
                                  ? 'rounded-br-md'
                                  : 'rounded-bl-md'
                              }`}
                            >
                              {!isOwnMessage && selectedConversation.type === 'GROUP' && !isGrouped && (
                                <p className="text-xs font-medium mb-2 text-brand-primary">
                                  {message.senderName}
                                </p>
                              )}
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              <div className={`flex items-center justify-between mt-2 ${
                                isOwnMessage ? 'text-white/75' : 'text-gray-500'
                              }`}>
                                <p className="text-xs">
                                  {formatTime(message.createdAt)}
                                </p>
                                {getStatusIcon()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t bg-gradient-to-r from-slate-50 to-brand-secondary/30">
                    <div className="flex items-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-brand-primary hover:bg-brand-primary/10 self-end mb-1"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Type a message... (Press Enter to send)"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          className="pr-12 resize-none border-brand-primary/20 focus:border-brand-primary rounded-full"
                          style={{ minHeight: '40px' }}
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <Button
                            onClick={sendMessage}
                            disabled={!newMessage.trim()}
                            size="sm"
                            className={`rounded-full w-8 h-8 p-0 transition-all duration-200 ${
                              newMessage.trim()
                                ? 'bg-brand-primary hover:bg-brand-primary-dark scale-100'
                                : 'bg-gray-300 scale-90'
                            }`}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>
                        {selectedConversation.type === 'DIRECT' ? 'Direct message' : 'Group chat'}
                      </span>
                      {newMessage.length > 0 && (
                        <span className={newMessage.length > 500 ? 'text-red-500' : ''}>
                          {newMessage.length}/1000
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                    <p>Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}