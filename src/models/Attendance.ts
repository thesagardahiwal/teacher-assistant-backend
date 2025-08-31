import mongoose, { Schema } from "mongoose";

const AttendanceSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "LectureSession", required: true },
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },

  presentStudents: [{ type: Schema.Types.ObjectId, ref: "Student" }],
  absentStudents: [{ type: Schema.Types.ObjectId, ref: "Student" }],

  uploadedSheet: { type: String }, // If OCR used
  ocrExtractedRolls: [String],

  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("Attendance", AttendanceSchema);