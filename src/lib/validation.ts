import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, { message: "Please enter your email 😊" })
      .email({ message: "That doesn't look like a valid email 💌" })
      .max(255),

    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters 🔒" })
      .max(100),

    repeatPassword: z
      .string()
      .min(6, { message: "Repeat password must be at least 6 characters 🔁" }),

    username: z
      .string()
      .trim()
      .min(3, { message: "Username must be at least 3 characters ✨" })
      .max(30)
      // .regex(/^[a-zA-Z0-9_]+$/, {
      //   message: "Letters, numbers and _ only please 🙏",
      // }),
      .regex(
        /^[\p{L}\p{N}_]+$/u,
        "Username can contain letters and numbers only"
      ),

    firstName: z
      .string()
      .trim()
      .min(1, { message: "First name is required 🌟" })
      .max(50),

    lastName: z
      .string()
      .trim()
      .min(1, { message: "Last name is required 🌟" })
      .max(50),
  })


  .refine((data) => data.password === data.repeatPassword, {
    message: "Passwords don't match 💫",
    path: ["repeatPassword"],
  })

  .refine((data) => data.email.includes("@"), {
    message: "Email must include @ 📧",
    path: ["email"],
  })


  .refine((data) => !data.password.includes(" "), {
    message: "Password should not contain spaces 🚫",
    path: ["password"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;