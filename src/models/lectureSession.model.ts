import { Schema, model, Document } from "mongoose";

export interface ILectureSession extends Document {
  sessionId: string;
  subject: Schema.Types.ObjectId;
  batch: Schema.Types.ObjectId;
  teacher: Schema.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  status: "Scheduled" | "Rescheduled" | "Cancelled" | "Completed";
  topic?: string;
  diaryNote?: string;
  attendanceTaken: boolean;
  attendance?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LectureSessionSchema = new Schema<ILectureSession>(
  {
    sessionId: { type: String, unique: true, required: true }, // "CSE101-2025-01-10-1"

    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },

    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // e.g., "10:00 AM"
    endTime: { type: String, required: true },   // e.g., "11:00 AM"

    status: {
      type: String,
      enum: ["Scheduled", "Rescheduled", "Cancelled", "Completed"],
      default: "Scheduled",
    },

    topic: { type: String },
    diaryNote: { type: String },

    attendanceTaken: { type: Boolean, default: false },
    attendance: { type: Schema.Types.ObjectId, ref: "Attendance" },
  },
  { timestamps: true }
);

export default model<ILectureSession>("LectureSession", LectureSessionSchema);
