import * as z from 'zod';

export const studentSchema = z.object({
  rollNumber: z.string().min(1, "Roll number required"),
  name: z.string().min(1, "Name is required"),
  email: z.email().optional(),
  phone: z.string().length(10).optional(),
  batch: z.string().min(1, "Batch is required"),
  department: z.string().min(1, "Department is required"),
  enrollmentNumber: z.string().min(1, "Enrollment number is required"),
  guardian: z
    .object({
      name: z.string().optional(),
      phone: z.string().length(10).optional(),
      email: z.email().optional(),
    })
    .optional(),
});

export const studentArraySchema = z.array(studentSchema);