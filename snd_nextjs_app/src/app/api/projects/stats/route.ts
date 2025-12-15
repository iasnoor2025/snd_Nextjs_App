import { db } from '@/lib/drizzle';
import { projects as projectsTable } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects/stats - Get project statistics
const getProjectStatsHandler = async (_request: NextRequest) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Get all projects with their status and dates
    const allProjects = await db
      .select({
        id: projectsTable.id,
        status: projectsTable.status,
        startDate: projectsTable.startDate,
        endDate: projectsTable.endDate,
      })
      .from(projectsTable);

    // Calculate statistics
    const total = allProjects.length;
    
    // Active projects: status is 'active' or 'in_progress'
    const active = allProjects.filter(
      p => p.status === 'active' || p.status === 'in_progress'
    ).length;
    
    // Completed projects: status is 'completed'
    const completed = allProjects.filter(
      p => p.status === 'completed'
    ).length;
    
    // Delayed projects: end date has passed but status is not 'completed'
    const delayed = allProjects.filter(p => {
      if (!p.endDate) return false;
      const endDate = new Date(p.endDate);
      endDate.setHours(0, 0, 0, 0);
      const endDateStr = endDate.toISOString().split('T')[0];
      return endDateStr < todayStr && p.status !== 'completed';
    }).length;

    return NextResponse.json({
      success: true,
      data: {
        total,
        active,
        completed,
        delayed,
      },
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch project statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.project.read)(getProjectStatsHandler);
