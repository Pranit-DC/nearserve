import { NextResponse } from 'next/server';
import { checkUser } from '@/lib/checkUser';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    
    console.log('[Auth Debug] Session cookie exists:', !!sessionCookie);
    console.log('[Auth Debug] Session cookie length:', sessionCookie?.length || 0);
    
    const user = await checkUser();
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        hasSessionCookie: !!sessionCookie,
        message: 'Not authenticated - checkUser() returned null',
        action: 'Please sign out and sign back in'
      });
    }

    return NextResponse.json({
      authenticated: true,
      hasSessionCookie: !!sessionCookie,
      userId: user.id,
      email: user.email,
      role: user.role,
      message: 'Authentication working correctly!'
    });
  } catch (error) {
    console.error('[Auth Debug] Error:', error);
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Error checking authentication'
    }, { status: 500 });
  }
}
