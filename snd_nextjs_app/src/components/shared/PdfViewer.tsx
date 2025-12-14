'use client';

import { useEffect, useState, useRef } from 'react';
import { FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamic import for PDF.js to avoid SSR issues
let pdfjsLib: any = null;

interface PdfViewerProps {
  url: string;
  downloadUrl?: string; // Optional download endpoint URL for authenticated access
  className?: string;
}

export default function PdfViewer({ url, downloadUrl, className = '' }: PdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
      }
      
      setPdfjsLoaded(true);
    }).catch((err) => {
      console.error('Failed to load PDF.js:', err);
      setError('Failed to load PDF viewer');
      setLoading(false);
    });
  }, []);

  // Load PDF document
  useEffect(() => {
    if (!pdfjsLoaded || !pdfjsLib) return;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build the fetch URL - use /preview endpoint with base64 for project documents
        let fetchUrl: string;
        if (downloadUrl) {
          fetchUrl = downloadUrl.replace('/download', '/preview');
          fetchUrl = `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}base64=1`;
        } else {
          fetchUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
        }
        
        const cacheBustUrl = `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
        
        console.log('📥 Loading PDF for viewer:', cacheBustUrl);
        
        // Fetch as JSON (base64) - IDM doesn't intercept JSON
        const response = await fetch(cacheBustUrl, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        let pdfData: Uint8Array;
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
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
          console.log(`✅ PDF data loaded (base64): ${pdfData.length} bytes`);
        } else {
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          pdfData = new Uint8Array(arrayBuffer);
          console.log(`✅ PDF data loaded (binary): ${pdfData.length} bytes`);
        }

        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdfDoc = await loadingTask.promise;
        
        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        setCurrentPage(1);
        setLoading(false);
        
        console.log(`✅ PDF loaded: ${pdfDoc.numPages} pages`);
      } catch (err) {
        console.error('❌ Error loading PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
        setLoading(false);
      }
    };

    loadPdf();
  }, [url, downloadUrl, pdfjsLoaded]);

  // Render current page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Calculate viewport with scale and rotation
        const viewport = page.getViewport({ scale, rotation });
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();
  }, [pdf, currentPage, scale, rotation]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded ${className}`}>
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">Failed to load PDF</p>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (loading || !pdf) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading PDF...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`} ref={containerRef}>
      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-100 p-2 rounded-t border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={zoomIn} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={rotate} title="Rotate">
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto bg-gray-200 p-4 flex justify-center">
        <canvas
          ref={canvasRef}
          className="shadow-lg bg-white"
        />
      </div>
    </div>
  );
}
