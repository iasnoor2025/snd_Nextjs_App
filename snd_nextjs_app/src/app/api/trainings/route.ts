import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/lib/drizzle';
import { trainings } from '@/lib/drizzle/schema';
import { and, ilike, eq, asc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// GET /api/trainings - Get all training programs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const limit = parseInt(searchParams.get('limit') || '1000');
    const h2sOnly = searchParams.get('h2sOnly') === 'true';

    const filters: any[] = [eq(trainings.status, 'active')];
    if (search) {
      const s = `%${search}%`;
      filters.push(ilike(trainings.name, s));
    }

    const base = db
      .select()
      .from(trainings)
      .where(and(...filters))
      .orderBy(asc(trainings.name));

    const rows = await (limit ? base.limit(limit) : base);

    const data = h2sOnly
      ? rows.filter(t =>
          (t.name || '').toLowerCase().includes('h2s') ||
          (t.name || '').toLowerCase().includes('hydrogen sulfide') ||
          (t.name || '').toLowerCase().includes('scba') ||
          (t.category || '').toLowerCase().includes('safety')
        )
      : rows;

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error('Error fetching training programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training programs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/trainings - Create a training program (idempotent by name)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = (body.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const payload = {
      name,
      description: body.description ?? null,
      category: body.category ?? 'Safety',
      duration: body.duration ?? null,
      provider: body.provider ?? null,
      cost: body.cost ?? null,
      maxParticipants: body.maxParticipants ?? null,
      prerequisites: body.prerequisites ?? null,
      objectives: body.objectives ?? null,
      materials: body.materials ?? null,
      status: body.status ?? 'active',
      updatedAt: new Date().toISOString().split('T')[0],
    } as any;

    // Upsert by name (case-insensitive)
    const existing = await db.select().from(trainings).where(ilike(trainings.name, name)).limit(1);
    if (existing.length > 0) {
      const [updated] = await db
        .update(trainings)
        .set(payload)
        .where(eq(trainings.id, existing[0].id))
        .returning();
      return NextResponse.json({ success: true, data: updated, message: 'Training updated' });
    }

    const [created] = await db
      .insert(trainings)
      .values({
        ...payload,
        createdAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    return NextResponse.json({ success: true, data: created, message: 'Training created' }, { status: 201 });
  } catch (error) {
    console.error('Error creating training:', error);
    return NextResponse.json(
      { error: 'Failed to create training', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

