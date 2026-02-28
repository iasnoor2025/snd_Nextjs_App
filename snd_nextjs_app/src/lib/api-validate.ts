/**
 * Shared Zod validation utilities for API routes.
 * Use with: const body = await validateBody(request, schema);
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function validateBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body) as z.infer<T>;
    return { data };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        error: NextResponse.json(
          { error: 'Validation failed', details: err.errors },
          { status: 400 }
        ),
      };
    }
    return {
      error: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }),
    };
  }
}

export const commonSchemas = {
  idParam: z.object({ id: z.string().regex(/^\d+$/, 'ID must be a number') }),
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(25),
  }),
};
