import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
    const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
    const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      return NextResponse.json({
        success: false,
        message: 'ERPNext configuration is missing',
      }, { status: 500 });
    }

    // Test 1: Get all items without filter
    console.log('Testing 1: Getting all items...');
    const allItemsResponse = await fetch(`${ERPNEXT_URL}/api/resource/Item?limit_page_length=10`, {
      headers: {
        'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!allItemsResponse.ok) {
      const errorText = await allItemsResponse.text();
      return NextResponse.json({
        success: false,
        message: `Failed to fetch items: ${allItemsResponse.status} ${allItemsResponse.statusText}`,
        error: errorText
      }, { status: 500 });
    }

    const allItemsData = await allItemsResponse.json();
    console.log('All items response:', allItemsData);

    // Test 2: Get items with different item_group filters
    const itemGroups = ['Equipment', 'equipment', 'EQUIPMENT', 'Machinery', 'Tools', 'Vehicles'];
    const results: any = {};

    for (const group of itemGroups) {
      console.log(`Testing item_group: ${group}`);
      const filters = encodeURIComponent(JSON.stringify([["item_group", "=", group]]));
      const endpoint = `/api/resource/Item?filters=${filters}&limit_page_length=10`;
      
      try {
        const response = await fetch(`${ERPNEXT_URL}${endpoint}`, {
          headers: {
            'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          results[group] = {
            count: data.data?.length || 0,
            items: data.data?.slice(0, 3) || [] // Show first 3 items
          };
        } else {
          results[group] = {
            error: `${response.status}: ${response.statusText}`
          };
        }
      } catch (error) {
        results[group] = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Test 3: Get unique item groups
    console.log('Testing 3: Getting unique item groups...');
    const groupsResponse = await fetch(`${ERPNEXT_URL}/api/resource/Item?fields=["item_group"]&limit_page_length=1000`, {
      headers: {
        'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    let uniqueGroups: string[] = [];
    if (groupsResponse.ok) {
      const groupsData = await groupsResponse.json();
      const groups = groupsData.data?.map((item: any) => item.item_group).filter(Boolean) || [];
      uniqueGroups = [...new Set(groups as string[])];
    }

    return NextResponse.json({
      success: true,
      message: 'ERPNext equipment debug completed',
      data: {
        allItems: {
          count: allItemsData.data?.length || 0,
          sample: allItemsData.data?.slice(0, 3) || []
        },
        itemGroupTests: results,
        uniqueItemGroups: uniqueGroups,
        config: {
          url: ERPNEXT_URL,
          hasKey: !!ERPNEXT_API_KEY,
          hasSecret: !!ERPNEXT_API_SECRET
        }
      }
    });

  } catch (error) {
    console.error('Error in equipment debug:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to debug equipment',
      },
      { status: 500 }
    );
  }
} 