import mongoose, { Schema, Document } from "mongoose";

export interface IAssignment extends Document {
  title: string;
  description: string;
  subject: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  dueDate: Date;
  maxMarks: number;
  attachments?: string[];

  submissions: {
    student: mongoose.Types.ObjectId;
    submittedAt: Date;
    fileUrl?: string;
    marks?: number;
    remarks?: string;
    status: "Pending" | "Submitted" | "Graded";
  }[];
}

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
  dueDate: { type: Date, required: true },
  maxMarks: { type: Number, required: true },
  attachments: [String],

  submissions: [
    {
      student: { type: Schema.Types.ObjectId, ref: "Student" },
      submittedAt: Date,
      fileUrl: String,
      marks: Number,
      remarks: String,
      status: { type: String, enum: ["Pending", "Submitted", "Graded"], default: "Pending" }
    }
  ]
}, { timestamps: true });

export default mongoose.model<IAssignment>("Assignment", AssignmentSchema);
