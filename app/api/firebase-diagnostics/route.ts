/**
 * Firebase Diagnostics API Route
 * 
 * Visit /api/firebase-diagnostics to run Firebase connectivity tests
 * This will help identify any issues with data storage
 */

import { runFirebaseDiagnostics } from '@/lib/firebase-diagnostics';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const results = await runFirebaseDiagnostics();
    
    const passCount = results.tests.filter(t => t.status === 'PASS').length;
    const failCount = results.tests.filter(t => t.status === 'FAIL').length;
    
    return NextResponse.json({
      success: failCount === 0,
      summary: {
        passed: passCount,
        failed: failCount,
        total: results.tests.length,
      },
      results,
    }, {
      status: failCount === 0 ? 200 : 500,
    });
  } catch (error: any) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, {
      status: 500,
    });
  }
}
