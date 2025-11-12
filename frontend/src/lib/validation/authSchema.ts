import { z } from "zod";
const sendOTPSchema = z.object({
  username: z.string().min(2, "Enter your username"),
  email: z
    .string()
    .email("Enter a valid email address")
    .refine((email) => email.endsWith("@gmail.com"), {
      message: "Only Gmail addresses are allowed",
    }),
});

const confirmOTPSchema = z.object({
  OTP: z
    .string()
    .min(4, "OTP must be at least 4 digits")
    .max(6, "OTP cannot exceed 6 digits"),
});

export { sendOTPSchema, confirmOTPSchema };
