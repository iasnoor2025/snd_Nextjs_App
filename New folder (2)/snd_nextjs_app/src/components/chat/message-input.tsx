'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from '@/contexts/chat-context';
import { Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  conversationId: number;
  onSend?: () => void;
}

interface ImagePreview {
  file: File;
  preview: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ conversationId, onSend }) => {
  const { sendMessage, setTyping } = useChat();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const imagesRef = useRef<ImagePreview[]>([]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Keep ref in sync with state
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Cleanup image preview URLs on unmount
  useEffect(() => {
    return () => {
      imagesRef.current.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      return;
    }

    // Validate file size (10MB max per image)
    const validImages = imageFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Image ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    // Create previews
    const newImages: ImagePreview[] = validImages.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages(prev => [...prev, ...newImages]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      const removed = newImages[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return newImages.filter((_, i) => i !== index);
    });
  };

  const handleSend = async () => {
    if ((!content.trim() && images.length === 0) || isSending || uploading) return;

    setIsSending(true);
    setUploading(true);

    try {
      // Upload images first
      const uploadedFiles: Array<{ url: string; name: string; size: number }> = [];

      for (const image of images) {
        try {
          const formData = new FormData();
          formData.append('file', image.file);
          formData.append('type', 'chat');
          formData.append('bucket', 'chat-media');

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }

          const uploadData = await uploadResponse.json();
          if (uploadData.success) {
            // Use proxy route for secure access instead of direct S3 URL
            const fileName = uploadData.filename || uploadData.originalName || image.file.name;
            const proxyUrl = `/api/chat/media/${fileName}`;
            
            uploadedFiles.push({
              url: proxyUrl,
              name: uploadData.originalName || image.file.name,
              size: uploadData.size || image.file.size,
            });
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          alert(`Failed to upload ${image.file.name}. Please try again.`);
          setIsSending(false);
          setUploading(false);
          return;
        }
      }

      // Send message(s) with images
      if (uploadedFiles.length > 0) {
        // Send each image as a separate message if there's no text
        if (!content.trim()) {
          for (const file of uploadedFiles) {
            await sendMessage(conversationId, '', 'image', file);
          }
        } else {
          // Send text with first image, then send other images separately
          await sendMessage(conversationId, content.trim(), 'text');
          for (const file of uploadedFiles) {
            await sendMessage(conversationId, '', 'image', file);
          }
        }
      } else {
        // Send text-only message
        await sendMessage(conversationId, content.trim());
      }

      // Clear form and cleanup image previews
      images.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
      setContent('');
      setImages([]);
      setTyping(conversationId, false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      onSend?.();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Typing indicator
    if (e.target.value.trim()) {
      setTyping(conversationId, true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(conversationId, false);
      }, 3000);
    } else {
      setTyping(conversationId, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  return (
    <div className="border-t bg-background">
      {/* Image Previews */}
      {images.length > 0 && (
        <div className="p-4 border-b">
          <div className="flex gap-2 flex-wrap">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img
                    src={image.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || uploading}
            className="h-[60px] w-[60px]"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[60px] max-h-[200px] resize-none"
            rows={1}
            disabled={isSending || uploading}
          />
          <Button
            onClick={handleSend}
            disabled={(!content.trim() && images.length === 0) || isSending || uploading}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

