import { NextResponse } from 'next/server';

// Optimize API responses with compression and caching headers
export function createOptimizedResponse(data: any, options?: {
  cache?: number; // Cache duration in seconds
  compress?: boolean;
  etag?: boolean;
}) {
  const { cache = 300, compress = true, etag = true } = options || {};

  const response = NextResponse.json(data);

  // Add cache headers
  if (cache > 0) {
    response.headers.set('Cache-Control', `public, max-age=${cache}, s-maxage=${cache * 2}`);
  }

  // Add compression hint
  if (compress) {
    response.headers.set('Content-Encoding', 'gzip');
  }

  // Add ETag for caching
  if (etag) {
    const etag = `"${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16)}"`;
    response.headers.set('ETag', etag);
  }

  // Add performance headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
}

// Paginated response helper
export function createPaginatedResponse(
  data: any[],
  page: number,
  limit: number,
  total: number,
  options?: {
    cache?: number;
    additionalData?: Record<string, any>;
  }
) {
  const { cache = 300, additionalData = {} } = options || {};
  
  const totalPages = Math.ceil(total / limit);
  
  const responseData = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
    ...additionalData,
  };

  return createOptimizedResponse(responseData, { cache });
}

// Error response helper
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: any
) {
  const responseData = {
    success: false,
    error: message,
    ...(details && { details }),
    timestamp: new Date().toISOString(),
  };

  const response = NextResponse.json(responseData, { status });
  
  // Don't cache error responses
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  return response;
}
