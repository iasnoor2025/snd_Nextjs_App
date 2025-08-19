import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectExpenses, projects, employees } from '@/lib/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Build where conditions
    let whereConditions = [eq(projectExpenses.projectId, parseInt(projectId))];
    
    if (status && status !== 'all') {
      whereConditions.push(eq(projectExpenses.status, status));
    }
    
    if (category && category !== 'all') {
      whereConditions.push(eq(projectExpenses.category, category));
    }

    // Fetch expenses with related data
    const expenses = await db
      .select({
        id: projectExpenses.id,
        projectId: projectExpenses.projectId,
        title: projectExpenses.title,
        description: projectExpenses.description,
        category: projectExpenses.category,
        amount: projectExpenses.amount,
        expenseDate: projectExpenses.expenseDate,
        receiptNumber: projectExpenses.receiptNumber,
        approvedBy: projectExpenses.approvedBy,
        status: projectExpenses.status,
        paymentMethod: projectExpenses.paymentMethod,
        vendor: projectExpenses.vendor,
        notes: projectExpenses.notes,
        assignedTo: projectExpenses.assignedTo,
        createdAt: projectExpenses.createdAt,
        updatedAt: projectExpenses.updatedAt,
        approvedByName: employees.firstName,
        approvedByLastName: employees.lastName,
        assignedToName: employees.firstName,
        assignedToLastName: employees.lastName,
      })
      .from(projectExpenses)
      .leftJoin(employees, eq(projectExpenses.approvedBy, employees.id))
      .leftJoin(employees, eq(projectExpenses.assignedTo, employees.id))
      .where(and(...whereConditions))
      .orderBy(desc(projectExpenses.expenseDate));

    return NextResponse.json({ 
      success: true,
      data: expenses 
    });
  } catch (error) {
    console.error('Error fetching project expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch project expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Verify project exists
    const project = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      amount,
      expenseDate,
      receiptNumber,
      paymentMethod,
      vendor,
      notes,
      assignedTo,
    } = body;

    // Validation
    if (!title || !category || !amount || !expenseDate) {
      return NextResponse.json({ error: 'Title, category, amount, and expense date are required' }, { status: 400 });
    }

    // Create expense
    const [newExpense] = await db
      .insert(projectExpenses)
      .values({
        projectId: parseInt(projectId),
        title,
        description,
        category,
        amount: parseFloat(amount),
        expenseDate: new Date(expenseDate),
        receiptNumber,
        paymentMethod,
        vendor,
        notes,
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
        status: 'pending',
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ 
      success: true,
      data: newExpense,
      message: 'Expense added successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding expense:', error);
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get expense ID from query params
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get('id');

    if (!expenseId || isNaN(parseInt(expenseId))) {
      return NextResponse.json({ error: 'Invalid expense ID' }, { status: 400 });
    }

    // Verify project exists
    const project = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify expense exists
    const existingExpense = await db
      .select({ id: projectExpenses.id })
      .from(projectExpenses)
      .where(and(
        eq(projectExpenses.id, parseInt(expenseId)),
        eq(projectExpenses.projectId, parseInt(projectId))
      ))
      .limit(1);

    if (existingExpense.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      amount,
      expenseDate,
      receiptNumber,
      approvedBy,
      status,
      paymentMethod,
      vendor,
      notes,
      assignedTo,
    } = body;

    // Validation
    if (!title || !category || !amount || !expenseDate) {
      return NextResponse.json({ error: 'Title, category, amount, and expense date are required' }, { status: 400 });
    }

    // Update expense
    const [updatedExpense] = await db
      .update(projectExpenses)
      .set({
        title,
        description,
        category,
        amount: parseFloat(amount),
        expenseDate: new Date(expenseDate),
        receiptNumber,
        approvedBy: approvedBy ? parseInt(approvedBy) : null,
        status: status || 'pending',
        paymentMethod,
        vendor,
        notes,
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
        updatedAt: new Date(),
      })
      .where(eq(projectExpenses.id, parseInt(expenseId)))
      .returning();

    return NextResponse.json({ 
      success: true,
      data: updatedExpense,
      message: 'Expense updated successfully' 
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get expense ID from query params
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get('id');

    if (!expenseId || isNaN(parseInt(expenseId))) {
      return NextResponse.json({ error: 'Invalid expense ID' }, { status: 400 });
    }

    // Verify project exists
    const project = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify expense exists
    const existingExpense = await db
      .select({ id: projectExpenses.id })
      .from(projectExpenses)
      .where(and(
        eq(projectExpenses.id, parseInt(expenseId)),
        eq(projectExpenses.projectId, parseInt(projectId))
      ))
      .limit(1);

    if (existingExpense.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Delete expense
    await db
      .delete(projectExpenses)
      .where(eq(projectExpenses.id, parseInt(expenseId)));

    return NextResponse.json({ 
      success: true,
      message: 'Expense deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
