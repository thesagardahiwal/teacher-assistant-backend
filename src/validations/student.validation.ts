import * as z from 'zod';

export const studentSchema = z.object({
  rollNumber: z.string().min(1, "Roll number required"),
  name: z.string().min(1, "Name is required"),
  email: z.email().optional(),
  phone: z.string().length(10).optional(),
  batch: z.string().min(1, "Batch is required"),
  department: z.string().min(1, "Department is required"),
});

export const studentArraySchema = z.array(studentSchema);