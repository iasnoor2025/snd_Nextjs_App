import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    // Fetch countries from REST Countries API with required fields
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,demonyms,flags,cca2');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.status} ${response.statusText}`);
    }
    
    const countries = await response.json();
    
    // Validate that we received an array
    if (!Array.isArray(countries)) {
      throw new Error('Invalid response format from countries API');
    }
    
    // Transform the data to include common name, official name, and nationality
    const transformedCountries = countries.map((country: any) => {
      // Handle cases where some properties might be undefined
      const commonName = country.name?.common || 'Unknown';
      const officialName = country.name?.official || commonName;
      const nationality = country.demonyms?.eng?.m || commonName;
      const flag = country.flags?.svg || '';
      const code = country.cca2 || '';
      
      return {
        name: commonName,
        officialName: officialName,
        nationality: nationality,
        flag: flag,
        code: code
      };
    }).filter(country => country.name !== 'Unknown'); // Filter out invalid entries
    
    // Handle duplicate nationalities by adding country name to distinguish them
    const nationalityMap = new Map();
    transformedCountries.forEach(country => {
      const key = country.nationality.toLowerCase();
      if (nationalityMap.has(key)) {
        // If we have multiple countries with the same nationality, append country name
        const existing = nationalityMap.get(key);
        if (existing.length === 1) {
          // First duplicate found, update the existing one
          existing[0].nationality = `${existing[0].nationality} (${existing[0].name})`;
        }
        // Update current country's nationality to include country name
        country.nationality = `${country.nationality} (${country.name})`;
        nationalityMap.get(key).push(country);
      } else {
        nationalityMap.set(key, [country]);
      }
    });
    
    // Sort by name
    transformedCountries.sort((a: any, b: any) => a.name.localeCompare(b.name));
    
    // Filter by search if provided
    let filteredCountries = transformedCountries;
    if (search) {
      filteredCountries = transformedCountries.filter((country: any) =>
        country.name.toLowerCase().includes(search.toLowerCase()) ||
        country.officialName.toLowerCase().includes(search.toLowerCase()) ||
        country.nationality.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Limit results to prevent overwhelming the dropdown
    const limitedCountries = filteredCountries.slice(0, 200);
    
    return NextResponse.json({
      success: true,
      data: limitedCountries,
      total: filteredCountries.length,
      message: 'Countries retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch countries',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
