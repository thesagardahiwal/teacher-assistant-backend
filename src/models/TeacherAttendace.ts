import mongoose, { Schema } from "mongoose";

const TeacherAttendanceSchema = new Schema({
  teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Present", "Absent", "Leave"], default: "Present" },
  reason: { type: String }, // if on leave
  substituteHandledBy: { type: Schema.Types.ObjectId, ref: "Teacher" }, // optional
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("TeacherAttendance", TeacherAttendanceSchema);