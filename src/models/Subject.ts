import mongoose, { Schema } from "mongoose";

const SubjectSchema = new Schema({
  subjectId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  code: { type: String, unique: true },
  credits: { type: Number },

  teachers: [{ type: Schema.Types.ObjectId, ref: "Teacher" }],
  batches: [{ type: Schema.Types.ObjectId, ref: "Batch" }],

  syllabus: [{
    moduleId: String,
    title: String,
    description: String,
    isCompleted: { type: Boolean, default: false },
    proofFiles: [String], // PPT, Notes URLs
    completedOn: Date
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
export default mongoose.model("Subject", SubjectSchema);