// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import { authOptions } from "@/libs/next-auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Also export authOptions from here to make it available for imports
export { authOptions };