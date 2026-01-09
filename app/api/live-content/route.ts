/**
 * API Route: Live Content Management
 * 
 * Endpoints for managing real-time content in Firestore
 * Collection: refresh_data
 * 
 * Methods:
 * - POST: Add new content item
 * - PUT: Update existing content item
 * - DELETE: Remove content item
 * - GET: Fetch all content items (for testing)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  addLiveContent,
  updateLiveContent,
  deleteLiveContent,
  getAllLiveContent,
  addTestContent,
  clearAllLiveContent,
} from '@/lib/refresh-data-service';

/**
 * POST - Add new live content
 * Body: { title: string, message: string, ...additionalFields }
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields: title and message' },
        { status: 400 }
      );
    }

    // Handle special actions
    if (data.action === 'addTest') {
      const count = data.count || 5;
      const ids = await addTestContent(count);
      return NextResponse.json({
        success: true,
        message: `Added ${count} test items`,
        ids,
      });
    }

    // Add the content
    const id = await addLiveContent({
      title: data.title,
      message: data.message,
      ...data.additionalFields,
    });

    console.log('✅ [API] Live content added:', id);

    return NextResponse.json({
      success: true,
      id,
      message: 'Content added successfully',
    });
  } catch (error: any) {
    console.error('❌ [API] Error adding content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add content' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update existing content
 * Body: { id: string, title?: string, message?: string, ...additionalFields }
 */
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Extract id and update data
    const { id, ...updateData } = data;
    await updateLiveContent(id, updateData);

    console.log('✅ [API] Live content updated:', id);

    return NextResponse.json({
      success: true,
      message: 'Content updated successfully',
    });
  } catch (error: any) {
    console.error('❌ [API] Error updating content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update content' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove content
 * Query: ?id=<documentId> or ?action=clearAll
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    // Clear all content
    if (action === 'clearAll') {
      const count = await clearAllLiveContent();
      console.log('✅ [API] All live content cleared:', count);
      return NextResponse.json({
        success: true,
        message: `Cleared ${count} items`,
        count,
      });
    }

    // Delete single item
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    await deleteLiveContent(id);
    console.log('✅ [API] Live content deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ [API] Error deleting content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete content' },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch all content (for testing)
 * Query: ?limit=<number>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const content = await getAllLiveContent(limit);

    return NextResponse.json({
      success: true,
      count: content.length,
      content,
    });
  } catch (error: any) {
    console.error('❌ [API] Error fetching content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
