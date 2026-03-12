import { z } from "zod";

export const registrationBaseSchema = z.object({
  email: z.email("Invalid email address"),
  password1: z.string().min(8, "Password must be at least 8 characters long"),
  password2: z.string().min(8, "Password must be at least 8 characters long"),
});

export const registrationSchema = registrationBaseSchema.refine(
  (fields) => fields.password1 === fields.password2,
  {
    message: "Passwords do not match",
    path: ["password2"],
  },
);

export const emailSchema = z.object({
  email: z.email(),
});
