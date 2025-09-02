import mongoose, { Schema, Document } from "mongoose";

export interface ISubject extends Document {
  name: string;
  code: string;
  department: string;
  year: number;
  semester: number;
  credits?: number;
  description?: string;

  batch: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;

  syllabus: {
    module: string;
    topics: string[];
    completedTopics: string[];
    proofs: string[];
  }[];

  assignments: mongoose.Types.ObjectId[];
}

const SubjectSchema = new Schema<ISubject>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  credits: { type: Number },
  description: { type: String },

  batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },

  syllabus: [
    {
      module: { type: String },
      topics: [String],
      completedTopics: [String],
      proofs: [String] // URLs of PPTs, notes, etc.
    }
  ],

  assignments: [{ type: Schema.Types.ObjectId, ref: "Assignment" }]
}, { timestamps: true });

export default mongoose.model<ISubject>("Subject", SubjectSchema);
