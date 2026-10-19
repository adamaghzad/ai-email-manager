import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: { signIn: "/login" },
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/emails/:path*",
    "/compose/:path*",
    "/jobs/:path*",
    "/approvals/:path*",
    "/settings/:path*",
  ],
}
