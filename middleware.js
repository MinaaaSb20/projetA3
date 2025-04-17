import { NextResponse } from 'next/server';

export function middleware(request) {
  // Allow access to exported files
  if (request.nextUrl.pathname.startsWith('/exports/')) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/exports/:path*',
}; 