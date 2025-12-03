'use client';

import { useEffect, useState, useRef } from 'react';
import { FileText } from 'lucide-react';

// Dynamic import for PDF.js to avoid SSR issues
let pdfjsLib: any = null;

interface PdfThumbnailProps {
  url: string;
  alt?: string;
  className?: string;
}

export default function PdfThumbnail({ url, alt = 'PDF Document', className = '' }: PdfThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadThumbnail = async () => {
      try {
        setLoading(true);
        setError(false);

        console.log('🔄 Starting PDF thumbnail load for:', url);

        // Set a timeout (15 seconds) to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.error('⏱️ PDF thumbnail loading timeout');
            setError(true);
            setLoading(false);
          }
        }, 15000);

        // Use proxy API route for external URLs to avoid CORS issues
        let pdfData: ArrayBuffer | Uint8Array | string = url;
        
        // If URL is external (MinIO/S3), use proxy
        if (url.startsWith('http://') || url.startsWith('https://')) {
          try {
            console.log('📡 Fetching PDF via proxy...');
            // Use our proxy API route
            const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl, {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache',
              },
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ Proxy fetch failed:', response.status, errorText);
              throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            console.log('✅ PDF fetched via proxy, size:', arrayBuffer.byteLength, 'bytes');
            pdfData = new Uint8Array(arrayBuffer);
          } catch (fetchError) {
            console.error('❌ Failed to fetch PDF via proxy, trying direct fetch:', fetchError);
            // Fallback: try direct fetch
            try {
              const directResponse = await fetch(url, {
                method: 'GET',
                headers: {
                  'Cache-Control': 'no-cache',
                },
              });
              
              if (!directResponse.ok) {
                throw new Error(`Direct fetch failed: ${directResponse.status}`);
              }
              
              const blob = await directResponse.blob();
              const arrayBuffer = await blob.arrayBuffer();
              pdfData = new Uint8Array(arrayBuffer);
              console.log('✅ PDF fetched directly, size:', arrayBuffer.byteLength, 'bytes');
            } catch (directError) {
              console.error('❌ Both proxy and direct fetch failed:', directError);
              throw directError;
            }
          }
        }

        console.log('📄 Loading PDF into PDF.js...');
        // Load the PDF - use data for ArrayBuffer/Uint8Array, url for string
        const loadingTask = pdfjsLib.getDocument(
          pdfData instanceof Uint8Array || pdfData instanceof ArrayBuffer
            ? { data: pdfData }
            : { url: pdfData as string }
        );
        
        console.log('⏳ Waiting for PDF to load...');
        const pdf = await loadingTask.promise;
        console.log('✅ PDF loaded, pages:', pdf.numPages);

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
          console.error('❌ Canvas not found after waiting');
          throw new Error('Canvas element not available');
        }

        // Get the first page
        console.log('📑 Getting first page...');
        const page = await pdf.getPage(1);

        // Set up canvas
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the page
        const context = canvas.getContext('2d');
        if (!context) {
          console.error('❌ Canvas context not found');
          throw new Error('Canvas context not available');
        }

        console.log('🎨 Rendering PDF page...');
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png');
        console.log('✅ PDF thumbnail generated successfully');
        
        // Clear timeout on success
        if (timeoutId) clearTimeout(timeoutId);
        
        if (isMounted) {
          setThumbnailUrl(dataUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Error loading PDF thumbnail:', err);
        console.error('📄 PDF URL:', url);
        console.error('🔍 Error details:', err instanceof Error ? err.message : String(err));
        
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
  }, [url, pdfjsLoaded]);

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
