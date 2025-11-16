'use client';

import { ChatMessage } from '@/lib/services/chat-service';
import { formatDistanceToNow } from 'date-fns';
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { translateText, detectLanguage, getCachedTranslation, setCachedTranslation, getTranslationCacheKey } from '@/lib/services/translation-service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreVertical, Trash2, Languages } from 'lucide-react';
import { useChat } from '@/contexts/chat-context';

interface MessageItemProps {
  message: ChatMessage;
  showAvatar: boolean;
  isOwnMessage: boolean;
  conversationId: number;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  showAvatar,
  isOwnMessage,
  conversationId,
}) => {
  const { data: session } = useSession();
  const { deleteMessage } = useChat();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const isOwn = message.sender.email === session?.user?.email;

  // Auto-translate message if it's in a different language than user's locale
  useEffect(() => {
    if (message.isDeleted || message.messageType !== 'text' || !message.content) {
      return;
    }

    const messageLang = detectLanguage(message.content);
    const userLang = locale as 'en' | 'ar';

    // Only translate if message is in different language and not from current user
    if (messageLang !== userLang && !isOwn) {
      // Check cache first
      const cacheKey = getTranslationCacheKey(message.content, userLang);
      const cached = getCachedTranslation(cacheKey);
      
      if (cached) {
        setTranslatedContent(cached);
      } else {
        // Translate message
        setIsTranslating(true);
        translateText(message.content, userLang)
          .then(translated => {
            // Only set translation if it's different from original (translation actually happened)
            if (translated && translated !== message.content) {
              setTranslatedContent(translated);
              setCachedTranslation(cacheKey, translated);
            } else {
              // Translation service not available or returned original text
              setTranslatedContent(null);
            }
          })
          .catch(error => {
            console.error('Translation error:', error);
            setTranslatedContent(null);
          })
          .finally(() => {
            setIsTranslating(false);
          });
      }
    } else {
      setTranslatedContent(null);
    }
  }, [message.content, message.isDeleted, message.messageType, locale, isOwn]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMessage(message.id, conversationId);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete message:', error);
      // Error is already handled in the context, just close the dialog
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        'flex gap-2 group',
        isOwn && 'flex-row-reverse'
      )}
    >
      {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={message.sender.avatar || undefined} />
          <AvatarFallback>
            {message.sender.name
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      {showAvatar && isOwn && <div className="w-8" />}
      <div className={cn('flex flex-col max-w-[70%]', isOwn && 'items-end')}>
        {showAvatar && (() => {
          // Capitalize first letter of each word in the name
          const capitalizeName = (name: string): string => {
            if (!name) return name;
            return name
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          };
          const senderName = capitalizeName(message.sender.name || message.sender.email || 'Unknown');
          return (
            <p className={cn('text-xs text-muted-foreground mb-1 px-2', isOwn && 'text-right')}>
              {senderName}
            </p>
          );
        })()}
        <div className={cn('flex items-start gap-2', isOwn && 'flex-row-reverse')}>
          {isOwn && !message.isDeleted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div
            className={cn(
              'rounded-lg px-3 py-2 relative group',
              isOwn
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground',
              message.isDeleted && 'opacity-60'
            )}
          >
          {message.replyToId && (
            <div className={cn('text-xs opacity-70 mb-1 pb-1 border-b', isOwn && 'border-primary-foreground/20')}>
              Replying to message
            </div>
          )}
          {message.isDeleted ? (
            <p className="text-sm italic opacity-70">This message was deleted</p>
          ) : message.messageType === 'image' && message.fileUrl ? (
            <div className="mb-2">
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg overflow-hidden max-w-sm"
              >
                <img
                  src={message.fileUrl.startsWith('/api/chat/media/') || message.fileUrl.startsWith('http') ? message.fileUrl : `/api/chat/media/${message.fileUrl}`}
                  alt={message.fileName || 'Image'}
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Image load error:', message.fileUrl);
                    // Fallback: try direct URL if proxy fails
                    if (message.fileUrl && !message.fileUrl.startsWith('http')) {
                      const target = e.target as HTMLImageElement;
                      target.src = message.fileUrl;
                    }
                  }}
                />
              </a>
              {message.content && (
                <div className="mt-2">
                  {translatedContent && !showOriginal ? (
                    <div>
                      <p className="text-sm whitespace-pre-wrap break-words">{translatedContent}</p>
                      <button
                        onClick={() => setShowOriginal(true)}
                        className="text-xs opacity-70 mt-1 hover:opacity-100 flex items-center gap-1"
                        type="button"
                      >
                        <Languages className="h-3 w-3" />
                        <span>Show original</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      {translatedContent && showOriginal && (
                        <button
                          onClick={() => setShowOriginal(false)}
                          className="text-xs opacity-70 mt-1 hover:opacity-100 flex items-center gap-1"
                          type="button"
                        >
                          <Languages className="h-3 w-3" />
                          <span>Show translation</span>
                        </button>
                      )}
                      {isTranslating && (
                        <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                          <Languages className="h-3 w-3 animate-pulse" />
                          <span>Translating...</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : message.messageType === 'file' && message.fileUrl ? (
            <div className="mb-2">
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm underline hover:opacity-80"
              >
                <span>📎 {message.fileName || 'File'}</span>
                {message.fileSize && (
                  <span className="text-xs opacity-70">
                    ({(message.fileSize / 1024).toFixed(1)} KB)
                  </span>
                )}
              </a>
              {message.content && (
                <div className="mt-2">
                  {translatedContent && !showOriginal ? (
                    <div>
                      <p className="text-sm whitespace-pre-wrap break-words">{translatedContent}</p>
                      <button
                        onClick={() => setShowOriginal(true)}
                        className="text-xs opacity-70 mt-1 hover:opacity-100 flex items-center gap-1"
                        type="button"
                      >
                        <Languages className="h-3 w-3" />
                        <span>Show original</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      {translatedContent && showOriginal && (
                        <button
                          onClick={() => setShowOriginal(false)}
                          className="text-xs opacity-70 mt-1 hover:opacity-100 flex items-center gap-1"
                          type="button"
                        >
                          <Languages className="h-3 w-3" />
                          <span>Show translation</span>
                        </button>
                      )}
                      {isTranslating && (
                        <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                          <Languages className="h-3 w-3 animate-pulse" />
                          <span>Translating...</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              {translatedContent && !showOriginal ? (
                <div>
                  <p className="text-sm whitespace-pre-wrap break-words">{translatedContent}</p>
                  <button
                    onClick={() => setShowOriginal(true)}
                    className="text-xs opacity-70 mt-1 hover:opacity-100 flex items-center gap-1"
                    type="button"
                  >
                    <Languages className="h-3 w-3" />
                    <span>Show original</span>
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  {translatedContent && showOriginal && (
                    <button
                      onClick={() => setShowOriginal(false)}
                      className="text-xs opacity-70 mt-1 hover:opacity-100 flex items-center gap-1"
                      type="button"
                    >
                      <Languages className="h-3 w-3" />
                      <span>Show translation</span>
                    </button>
                  )}
                  {isTranslating && (
                    <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                      <Languages className="h-3 w-3 animate-pulse" />
                      <span>Translating...</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {message.isEdited && !message.isDeleted && (
            <p className="text-xs opacity-70 mt-1">(edited)</p>
          )}
        </div>
        {!isOwn && <div className="w-6" />}
        </div>
        <p className="text-xs text-muted-foreground mt-1 px-2">
          {(() => {
            if (message.isDeleted && message.deletedAt) {
              const deletedAt = new Date(message.deletedAt);
              const now = new Date();
              const diffInSeconds = Math.floor((now.getTime() - deletedAt.getTime()) / 1000);
              if (diffInSeconds < 60) {
                return 'Deleted just now';
              }
              return `Deleted ${formatDistanceToNow(deletedAt, { addSuffix: true })}`;
            }
            
            // Parse timestamp - handle both ISO strings and database timestamp formats
            let createdAt: Date;
            try {
              const timestamp = message.createdAt;
              // If timestamp doesn't have timezone info, assume it's UTC
              if (typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-', 10)) {
                // Database timestamp without timezone - append Z to treat as UTC
                createdAt = new Date(timestamp + 'Z');
              } else {
                createdAt = new Date(timestamp);
              }
            } catch (e) {
              console.error('Error parsing timestamp:', message.createdAt, e);
              createdAt = new Date();
            }
            
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
            
            // Show "just now" for messages less than 1 minute old
            if (diffInSeconds < 60 && diffInSeconds >= 0) {
              return 'just now';
            }
            
            // If timestamp is in the future (timezone issue), show relative time anyway
            if (diffInSeconds < 0) {
              return formatDistanceToNow(createdAt, { addSuffix: true });
            }
            
            return formatDistanceToNow(createdAt, { addSuffix: true });
          })()}
          {message.isRead && isOwn && !message.isDeleted && ' • Read'}
        </p>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

