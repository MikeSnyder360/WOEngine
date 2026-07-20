import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // TODO: Implement proper password hashing + verification
        // For now, simple email-based auth (dev only)
        if (!credentials?.email) return null;

        // Find or create tenant by email
        let tenant = await prisma.tenant.findFirst({
          where: { contactEmail: credentials.email },
        });

        if (!tenant) {
          tenant = await prisma.tenant.create({
            data: {
              companyName: credentials.email.split('@')[0],
              contactEmail: credentials.email,
            },
          });
        }

        return {
          id: tenant.id,
          email: tenant.contactEmail,
          name: tenant.companyName,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};
