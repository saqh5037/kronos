import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 10;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(128, "Máximo 128 caracteres")
  .refine((p) => /[A-Za-z]/.test(p), "Debe contener al menos una letra")
  .refine((p) => /\d/.test(p), "Debe contener al menos un dígito");

export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Las contraseñas no coinciden",
  });

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

export const signInWithPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Requerido"),
});

export type SignInWithPasswordInput = z.infer<typeof signInWithPasswordSchema>;
