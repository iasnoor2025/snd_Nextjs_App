'use client';

import { useEffect, useState, useRef } from 'react';

interface ImageThumbnailProps {
  url: string;
  alt?: string;
  className?: string;
  downloadUrl?: string; // Optional download endpoint URL for authenticated access
}

export default function ImageThumbnail({ url, alt = 'Image', className = '', downloadUrl }: ImageThumbnailProps) {
  const [imageUrl, setImageUrl] = useState<string>(url);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate fetches (React Strict Mode)
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const loadImage = async () => {
      // Cleanup previous blob URL if exists
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }

      setLoading(true);
      setError(null);

      // If it's a direct URL (not MinIO) or no downloadUrl provided, use it directly
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setImageUrl(url);
        setLoading(false);
        return;
      }

      // If downloadUrl is provided (for project documents), fetch from it
      if (downloadUrl) {
        try {
          // Add cache-busting timestamp
          const cacheBustUrl = `${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
          console.log('🖼️ Fetching image from download endpoint:', cacheBustUrl);
          
          const response = await fetch(cacheBustUrl, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          }

          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          blobUrlRef.current = blobUrl;
          setImageUrl(blobUrl);
          setLoading(false);
          console.log('✅ Image loaded from download endpoint');
        } catch (fetchError) {
          console.error('❌ Failed to fetch image from download endpoint:', fetchError);
          // Fallback to PDF proxy or direct URL
          try {
            const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}&_t=${Date.now()}`;
            const proxyResponse = await fetch(proxyUrl, {
              method: 'GET',
              cache: 'no-store',
            });

            if (proxyResponse.ok) {
              const blob = await proxyResponse.blob();
              const blobUrl = URL.createObjectURL(blob);
              blobUrlRef.current = blobUrl;
              setImageUrl(blobUrl);
              setLoading(false);
              console.log('✅ Image loaded from PDF proxy');
            } else {
              throw new Error('Proxy also failed');
            }
          } catch (proxyError) {
            console.error('❌ Both download endpoint and proxy failed:', proxyError);
            setError('Failed to load image');
            setLoading(false);
          }
        }
      } else if (url.includes('minio') || url.includes('s3')) {
        // For MinIO URLs without downloadUrl, try PDF proxy
        try {
          const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}&_t=${Date.now()}`;
          const proxyResponse = await fetch(proxyUrl, {
            method: 'GET',
            cache: 'no-store',
          });

          if (proxyResponse.ok) {
            const blob = await proxyResponse.blob();
            const blobUrl = URL.createObjectURL(blob);
            blobUrlRef.current = blobUrl;
            setImageUrl(blobUrl);
            setLoading(false);
            console.log('✅ Image loaded from PDF proxy');
          } else {
            throw new Error('Proxy failed');
          }
        } catch (proxyError) {
          console.error('❌ Failed to load image via proxy:', proxyError);
          setError('Failed to load image');
          setLoading(false);
        }
      } else {
        // For other URLs, use directly
        setImageUrl(url);
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup blob URL on unmount or when URL changes
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [url, downloadUrl]);

  // Reset fetchedRef when url or downloadUrl changes
  useEffect(() => {
    fetchedRef.current = false;
  }, [url, downloadUrl]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded border border-gray-200 ${className}`}>
        <div className="text-center">
          <div className="text-3xl">🖼️</div>
          <div className="text-sm text-gray-600">IMG</div>
          <div className="text-xs text-red-500 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded border border-gray-200 ${className}`}>
        <div className="text-center">
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <img
        src={imageUrl}
        alt={alt}
        className={className}
        style={{ objectFit: 'contain', transformOrigin: 'center center' }}
        onLoad={(e) => {
          const img = e.target as HTMLImageElement;
          img.style.transform = 'rotate(0deg)';
          img.style.objectFit = 'contain';
          img.style.transition = 'all 0.3s ease-in-out';
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallbackDiv = target.nextElementSibling as HTMLElement;
          if (fallbackDiv) {
            fallbackDiv.style.display = 'flex';
          }
        }}
      />
      {/* Simple fallback icon - shown when image fails to load */}
      <div 
        className="w-full h-full hidden items-center justify-center bg-gray-100 rounded border border-gray-200"
      >
        <div className="text-center">
          <div className="text-3xl">🖼️</div>
          <div className="text-sm text-gray-600">IMG</div>
          {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
        </div>
      </div>
    </>
  );
}
