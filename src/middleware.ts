import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_vercel_do_not_use_in_real_prod_8f3a",
});

export const config = {
  matcher: ["/app/:path*"],
};
