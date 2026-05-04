import { db } from "./db";

export const DEV_LOGIN_PASSWORD = process.env.DEV_PASSWORD ?? "dev";

export type DevCredentials = {
  email?: string;
  password?: string;
};

export async function authorizeDev(creds: DevCredentials | undefined) {
  if (!creds?.email || !creds?.password) return null;
  if (creds.password !== DEV_LOGIN_PASSWORD) return null;

  const user = await db.user.findUnique({
    where: { email: creds.email },
    select: { id: true, email: true, name: true, image: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    image: user.image ?? null,
  };
}
