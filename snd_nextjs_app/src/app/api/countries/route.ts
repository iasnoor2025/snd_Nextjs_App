import { NextRequest, NextResponse } from 'next/server';
import { COUNTRIES, mapCountryToResponse } from '@/lib/data/countries';
import { withReadPermission } from '@/lib/rbac/api-middleware';

// Simple in-memory cache
let cachedAll: any[] | null = null;
let cacheTs = 0;
const TTL = 5 * 60 * 1000; // 5 minutes

function getAllCountries() {
  const now = Date.now();
  if (cachedAll && now - cacheTs < TTL) return cachedAll;
  cachedAll = COUNTRIES.map(mapCountryToResponse);
  cacheTs = now;
  return cachedAll;
}

const getCountriesHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '200');

    const all = getAllCountries();

    const filtered = search
      ? all.filter(c =>
          c.name.toLowerCase().includes(search) ||
          c.officialName.toLowerCase().includes(search) ||
          c.nationality.toLowerCase().includes(search) ||
          c.code.toLowerCase().includes(search)
        )
      : all;

    const data = filtered.slice(0, Math.max(1, Math.min(limit, 500)));

    return NextResponse.json({ success: true, data, total: filtered.length });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to load countries' },
      { status: 500 }
    );
  }
};

export const GET = withReadPermission('Settings')(getCountriesHandler);

