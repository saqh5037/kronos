import bcrypt from "bcryptjs";
import { db } from "./db";

export type PasswordCredentials = {
  email?: string;
  password?: string;
};

export type AuthorizedPasswordUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

export async function authorizePassword(
  creds: PasswordCredentials | undefined,
): Promise<AuthorizedPasswordUser | null> {
  if (!creds?.email || !creds?.password) return null;
  const email = creds.email.trim().toLowerCase();
  if (!email) return null;

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      passwordHash: true,
    },
  });
  if (!user || !user.passwordHash) return null;

  const ok = await bcrypt.compare(creds.password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    image: user.image ?? null,
  };
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
