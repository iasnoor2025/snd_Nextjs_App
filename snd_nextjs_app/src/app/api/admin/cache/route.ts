import { authOptions } from '@/lib/auth-config';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { 
  cacheService, 
  getCacheStats 
} from '@/lib/redis';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(PermissionConfigs.admin.read)(async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getCacheStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json({ error: 'Failed to get cache stats' }, { status: 500 });
  }
});

export const DELETE = withPermission(PermissionConfigs.admin.delete)(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'clear-all') {
      await cacheService.clearAll();
      return NextResponse.json({ message: 'All cache cleared successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
});

export const POST = withPermission(PermissionConfigs.admin.create)(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, target } = body;

    switch (action) {
      case 'clear-by-tag':
        if (!target) {
          return NextResponse.json({ error: 'Tag is required' }, { status: 400 });
        }
        await cacheService.clearByTags([target]);
        return NextResponse.json({ message: `Cache cleared for tag: ${target}` });

      case 'clear-by-prefix':
        if (!target) {
          return NextResponse.json({ error: 'Prefix is required' }, { status: 400 });
        }
        await cacheService.clearPrefix(target);
        return NextResponse.json({ message: `Cache cleared for prefix: ${target}` });

      case 'clear-dashboard':
        await cacheService.clearByTags(['dashboard']);
        return NextResponse.json({ message: 'Dashboard cache cleared successfully' });

      case 'clear-employees':
        await cacheService.clearByTags(['employees']);
        return NextResponse.json({ message: 'Employees cache cleared successfully' });

      case 'clear-equipment':
        await cacheService.clearByTags(['equipment']);
        return NextResponse.json({ message: 'Equipment cache cleared successfully' });

      case 'clear-customers':
        await cacheService.clearByTags(['customers']);
        return NextResponse.json({ message: 'Customers cache cleared successfully' });

      case 'clear-rentals':
        await cacheService.clearByTags(['rentals']);
        return NextResponse.json({ message: 'Rentals cache cleared successfully' });

      case 'clear-users':
        await cacheService.clearByTags(['users']);
        return NextResponse.json({ message: 'Users cache cleared successfully' });

      case 'clear-roles':
        await cacheService.clearByTags(['roles']);
        return NextResponse.json({ message: 'Roles cache cleared successfully' });

      case 'clear-permissions':
        await cacheService.clearByTags(['permissions']);
        return NextResponse.json({ message: 'Permissions cache cleared successfully' });

      case 'clear-skills':
        await cacheService.clearByTags(['skills']);
        return NextResponse.json({ message: 'Skills cache cleared successfully' });

      case 'clear-trainings':
        await cacheService.clearByTags(['trainings']);
        return NextResponse.json({ message: 'Trainings cache cleared successfully' });

      case 'clear-locations':
        await cacheService.clearByTags(['locations']);
        return NextResponse.json({ message: 'Locations cache cleared successfully' });

      case 'clear-settings':
        await cacheService.clearByTags(['settings']);
        return NextResponse.json({ message: 'Settings cache cleared successfully' });



      case 'clear-reports':
        await cacheService.clearByTags(['reports']);
        return NextResponse.json({ message: 'Reports cache cleared successfully' });

      case 'clear-payroll':
        await cacheService.clearByTags(['payroll']);
        return NextResponse.json({ message: 'Payroll cache cleared successfully' });

      case 'clear-quotations':
        await cacheService.clearByTags(['quotations']);
        return NextResponse.json({ message: 'Quotations cache cleared successfully' });

      case 'clear-invoices':
        await cacheService.clearByTags(['invoices']);
        return NextResponse.json({ message: 'Invoices cache cleared successfully' });

      case 'clear-system':
        await cacheService.clearByTags(['system']);
        return NextResponse.json({ message: 'System cache cleared successfully' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error performing cache action:', error);
    return NextResponse.json({ error: 'Failed to perform cache action' }, { status: 500 });
  }
});
