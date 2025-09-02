import { Schema, model, Document } from "mongoose";

export interface IBatch extends Document {
  batchId: string;
  name: string; // e.g., "CSE-A"
  year: string; // FE, SE, TE, BE
  department: string;
  students: Schema.Types.ObjectId[];
  subjects: Schema.Types.ObjectId[];
  teachers: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    batchId: { type: String, unique: true, required: true },
    name: { type: String, required: true }, // e.g., TY-CSE-Batch A
    year: { type: String }, // e.g., "FE", "SE"
    department: { type: String, required: true },

    students: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    teachers: [{ type: Schema.Types.ObjectId, ref: "Teacher" }],
  },
  { timestamps: true }
);

export default model<IBatch>("Batch", BatchSchema);
