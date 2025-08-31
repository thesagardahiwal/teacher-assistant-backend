import * as z from "zod";

// Teacher Register Validation
export const registerTeacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().length(10, "Phone number must be 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  department: z.string().min(1, "Department is required"),
});

// Teacher Login Validation
export const loginTeacherSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
