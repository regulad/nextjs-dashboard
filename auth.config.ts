import type {NextAuthConfig} from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({auth, request: {nextUrl}}) {
      const isLoggedIn = !!auth?.user; // pw: checks to see if user object has been populated
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard'); // pw: only pages that aren't the dashboard are the login page & the start page
      if (isOnDashboard) {
        // pw: if we are on the dashboard, we are authorized if we are logged in. easy peasy
        // pw: if this returns false, we will be redirected to the login page
        return isLoggedIn;
      } else if (isLoggedIn) {
        // pw: if we are logged in, and we are not on the dashboard, we are redirected to the dashboard
        // pw: we have no business being anywhere else
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
