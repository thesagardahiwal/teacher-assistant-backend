import mongoose, { Schema } from "mongoose";

const AssessmentSchema = new Schema({
  assessmentId: { type: String, unique: true, required: true },
  title: { type: String, required: true }, // e.g. "Assignment 1"
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },

  type: { type: String, enum: ["Assignment", "Quiz", "Test", "Exam"], required: true },
  maxMarks: { type: Number, required: true },
  date: { type: Date, required: true },

  studentMarks: [{
    student: { type: Schema.Types.ObjectId, ref: "Student" },
    obtainedMarks: Number,
    submitted: { type: Boolean, default: true }
  }],

  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("Assessment", AssessmentSchema);