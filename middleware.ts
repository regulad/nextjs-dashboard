import NextAuth from 'next-auth';
import {authConfig} from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // pw: from the above link
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  // pw: anything that hits the matcher will be handled by the middleware, if it doesn't hit it will be delivered straight
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};