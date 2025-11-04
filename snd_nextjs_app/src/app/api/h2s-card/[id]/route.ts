import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

import { H2SCardService } from '@/lib/services/h2s-card-service';

// GET /api/h2s-card/[id] - Get H2S card data by training record ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const trainingId = parseInt(id);

    if (!trainingId) {
      return NextResponse.json({ error: 'Invalid training ID' }, { status: 400 });
    }

    const cardData = await H2SCardService.getCardData(trainingId);

    if (!cardData) {
      return NextResponse.json({ error: 'Card data not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: cardData,
    });
  } catch (error) {
    console.error('Error fetching H2S card data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


