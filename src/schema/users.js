import z from "zod";

const userSchema = z.object({
  name: z.string().min(6).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(64),
  phone: z.string(),
  addressStreet: z.string().min(3).max(50),
  addressNumber: z.string().min(3).max(50),
});

export function validateUser(input) {
  return userSchema.safeParse(input);
}
