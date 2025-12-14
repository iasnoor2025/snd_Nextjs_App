'use client';

import { useEffect, useState, useRef } from 'react';
import { FileText } from 'lucide-react';

// Dynamic import for PDF.js to avoid SSR issues
let pdfjsLib: any = null;

interface PdfThumbnailProps {
  url: string;
  alt?: string;
  className?: string;
  downloadUrl?: string; // Optional download endpoint URL for authenticated access
}

export default function PdfThumbnail({ url, alt = 'PDF Document', className = '', downloadUrl }: PdfThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fetchedRef = useRef(false);

  // Load PDF.js on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;

    import('pdfjs-dist').then(async (pdfjs) => {
      pdfjsLib = pdfjs;
      
      // Fetch the worker from our API route and create a blob URL
      try {
        const workerResponse = await fetch('/api/pdfjs-worker');
        const workerText = await workerResponse.text();
        const workerBlob = new Blob([workerText], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(workerBlob);
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      } catch (err) {
        console.error('Failed to load worker from API, using fallback:', err);
        // Fallback to unpkg CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
      }
      
      setPdfjsLoaded(true);
    }).catch((err) => {
      console.error('Failed to load PDF.js:', err);
      setError(true);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!pdfjsLoaded || !pdfjsLib) return;
    
    // Prevent duplicate fetches (React Strict Mode)
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadThumbnail = async () => {
      try {
        setLoading(true);
        setError(false);

        // Set a timeout (20 seconds) to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.error('⏱️ PDF thumbnail loading timeout');
            setError(true);
            setLoading(false);
          }
        }, 20000);

        let pdfData: Uint8Array;
        
        // Build the fetch URL - use /preview endpoint for project documents
        // Add base64 parameter to get JSON response (bypasses IDM completely)
        let fetchUrl: string;
        if (downloadUrl) {
          // Replace /download with /preview in the URL and add base64 flag
          fetchUrl = downloadUrl.replace('/download', '/preview');
          fetchUrl = `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}base64=1`;
        } else {
          fetchUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
        }
        
        // Add cache-busting timestamp
        const cacheBustUrl = `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
        
        console.log('📥 Fetching PDF (base64) from:', cacheBustUrl);
        
        // Fetch as JSON - IDM doesn't intercept JSON responses!
        const response = await fetch(cacheBustUrl, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        console.log('📄 PDF Response:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        // Check if response is JSON (base64 encoded)
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          // Decode base64 response
          const jsonData = await response.json();
          if (!jsonData.data) {
            throw new Error('No data in JSON response');
          }
          
          // Decode base64 to Uint8Array
          const binaryString = atob(jsonData.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          pdfData = bytes;
          console.log(`✅ Received PDF data (base64 decoded): ${pdfData.length} bytes`);
        } else {
          // Fallback to binary response
          const blob = await response.blob();
          if (blob.size === 0) {
            throw new Error('Received empty PDF blob');
          }
          const arrayBuffer = await blob.arrayBuffer();
          pdfData = new Uint8Array(arrayBuffer);
          console.log(`✅ Received PDF data (binary): ${pdfData.length} bytes`);
        }

        // Load the PDF
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        if (!isMounted) return;

        // Ensure canvas is available - wait a bit if needed
        let canvas = canvasRef.current;
        let attempts = 0;
        while (!canvas && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          canvas = canvasRef.current;
          attempts++;
        }

        if (!canvas) {
          throw new Error('Canvas element not available');
        }

        // Get the first page
        const page = await pdf.getPage(1);

        // Set up canvas
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the page
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Canvas context not available');
        }

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png');

        // Clear timeout on success
        if (timeoutId) clearTimeout(timeoutId);
        
        if (isMounted) {
          setThumbnailUrl(dataUrl);
          setLoading(false);
          console.log('✅ PDF thumbnail rendered successfully');
        }
      } catch (err) {
        console.error('❌ Error loading PDF thumbnail:', err);
        
        // Clear timeout on error
        if (timeoutId) clearTimeout(timeoutId);
        
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [url, downloadUrl, pdfjsLoaded]);

  // Reset fetchedRef when url or downloadUrl changes
  useEffect(() => {
    fetchedRef.current = false;
  }, [url, downloadUrl]);

  if (error || (!loading && !thumbnailUrl && pdfjsLoaded)) {
    return (
      <div className={`w-full min-h-20 flex items-center justify-center rounded border border-gray-200 bg-gray-50 ${className}`}>
        <div className="text-center">
          <FileText className="h-10 w-10 mx-auto text-gray-400" />
          <div className="text-sm text-gray-600 mt-2">PDF</div>
        </div>
        {/* Always render canvas for PDF.js, even in error state */}
        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Always render canvas so it's available for PDF.js */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      {loading || !pdfjsLoaded ? (
        <div className="w-full min-h-20 flex items-center justify-center rounded border border-gray-200 bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
            <div className="text-sm text-gray-600 mt-2">Loading...</div>
          </div>
        </div>
      ) : thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={alt}
          className="w-full object-contain rounded border border-gray-200 bg-white"
          onError={() => {
            setError(true);
            setThumbnailUrl(null);
          }}
        />
      ) : null}
    </div>
  );
}
