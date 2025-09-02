import { z } from "zod";

export const markAttendanceSchema = z.object({
  lectureSessionId: z.string().min(1), // instead of free sessionId
  presentStudents: z.array(z.string()).default([]),
  absentStudents: z.array(z.string()).default([]),
});