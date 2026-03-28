import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import fs from "fs";
import path from "path";

type CsvUser = {
  partnerId: string;
  password: string;
  status?: number;
};

function readUsersFromCsv(): CsvUser[] {
  try {
    const filePath = path.join(process.cwd(), "Users.csv");
    const raw = fs.readFileSync(filePath, "utf8");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];
    const [headerLine, ...rows] = lines;
    const headers = headerLine.split(";").map((h) => h.trim().toLowerCase());

    const partnerIdx = headers.indexOf("partner_id");
    const idIdx = headers.indexOf("id");
    const emailIdx = headers.indexOf("email");
    const passwordIdx = headers.indexOf("password");
    const statusIdx = headers.indexOf("status");

    const keyIdx =
      partnerIdx >= 0 ? partnerIdx : idIdx >= 0 ? idIdx : emailIdx;
    if (keyIdx === -1 || passwordIdx === -1) return [];

    return rows.map((row) => {
      const cols = row.split(";").map((c) => c.trim());
      const statusRaw = statusIdx >= 0 ? cols[statusIdx] : "";
      const statusNum = Number(statusRaw);
      return {
        partnerId: cols[keyIdx] || "",
        password: cols[passwordIdx] || "",
        status: Number.isFinite(statusNum) ? statusNum : undefined,
      };
    });
  } catch (e) {
    console.error("Failed to read Users.csv:", e);
    return [];
  }
}

// В production на сервере ОБЯЗАТЕЛЬНЫ: NEXTAUTH_URL и NEXTAUTH_SECRET
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
const nextAuthUrl = process.env.NEXTAUTH_URL;

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  ...(nextAuthUrl ? { trustHost: true } : {}),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        partnerId: { label: "ID партнёра", type: "text" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const pid = credentials?.partnerId?.trim();
        if (!pid || !credentials?.password) return null;

        const users = readUsersFromCsv();
        const found = users.find((u) => u.partnerId.trim() === pid);
        if (!found) return null;

        // Пока тестируем — сравнение в открытом виде.
        // Позже можно заменить на bcrypt.compare(credentials.password, found.password).
        if (credentials.password !== found.password) return null;

        return {
          id: found.partnerId,
          email: `${found.partnerId}@partner.local`,
          name: `Партнёр ${found.partnerId}`,
          status: found.status,
        } as any;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user && (user as any).status != null) {
        const status = (user as any).status as number;
        (token as any).status = status;
        (token as any).partnerGroup = status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && (token as any).status != null) {
        const status = (token as any).status as number;
        (session.user as any).status = status;
        (session.user as any).partnerGroup = status;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
