import { z } from "zod";

export const createLectureSessionSchema = z.object({
  sessionId: z.string().min(1, "SessionId is required"),
  subject: z.string().min(1, "Subject is required"),
  batch: z.string().min(1, "Batch is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  topic: z.string().optional(),
  diaryNote: z.string().optional(),
});

export const updateLectureSessionSchema = z.object({
  lectureSessionId: z.string().min(1, "LectureSessionId is required"),
  status: z.enum(["Scheduled", "Rescheduled", "Cancelled", "Completed"]),
  newDate: z.string().optional(), // if rescheduled
  newStartTime: z.string().optional(),
  newEndTime: z.string().optional(),
  topic: z.string().optional(),
  diaryNote: z.string().optional(),
});
