import mongoose, { Schema } from "mongoose";

const LectureSessionSchema = new Schema({
  sessionId: { type: String, unique: true, required: true },
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },

  date: { type: Date, required: true },
  startTime: { type: String }, // "10:00 AM"
  endTime: { type: String },   // "11:00 AM"
  status: { type: String, enum: ["Scheduled", "Rescheduled", "Cancelled", "Completed"], default: "Scheduled" },

  topic: { type: String },
  diaryNote: { type: String },

  attendanceTaken: { type: Boolean, default: false },
  attendanceId: { type: Schema.Types.ObjectId, ref: "Attendance" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
export default mongoose.model("LectureSession", LectureSessionSchema);