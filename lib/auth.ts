import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // TODO: Add your database logic here to verify user credentials
        // This should include:
        // 1. Query your database for the user by email
        // 2. Compare the provided password with the hashed password in the database
        // 3. Return the user object if credentials are valid, null otherwise

        const user = {
          id: "1",
          email: credentials.email,
          name: credentials.email.split("@")[0],
        }

        return user
      },
    }),
  ],
  pages: {
    signIn: "/auth",
    signUp: "/auth",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}

// TODO: Implement this function to check credentials against your database
async function authenticateUser(email: string, password: string) {
  // This is a placeholder - replace with your actual authentication logic
  // You should hash passwords and check against your database

  // Example implementation:
  // const user = await db.user.findUnique({ where: { email } })
  // const isValid = await bcrypt.compare(password, user.hashedPassword)
  // return isValid ? user : null

  return null
}
