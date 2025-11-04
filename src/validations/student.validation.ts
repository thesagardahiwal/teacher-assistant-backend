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

const guardianSchema = z.object({
  name: z.string().optional(),
  phone: z.string().max(10, "Phone must be 10 characters or less").optional(),
  email: z.string().email().optional().or(z.literal('')),
});

// Student schema for import
export const studentImportSchema = z.object({
  studentId: z.string(),
  rollNumber: z.string().min(1, "Roll number is required"),
  enrollmentNumber: z.string().min(1, "Enrollment number is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(10, "Phone must be 10 characters or less").optional(),
  batch: z.string().min(1, "Batch is required"),
  department: z.string().min(1, "Department is required"),
  guardian: guardianSchema.optional(),
  attendanceStats: z.object({
    totalLectures: z.number().default(0),
    attendedLectures: z.number().default(0),
    percentage: z.number().default(0),
  }).optional(),
  performance: z.array(z.any()).optional(),
  year: z.string().optional(),
});

export const studentArraySchema = z.array(studentImportSchema);