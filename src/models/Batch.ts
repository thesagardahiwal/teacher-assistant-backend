import mongoose, { Schema } from "mongoose";

const BatchSchema = new Schema({
  batchId: { type: String, unique: true, required: true },
  name: { type: String, required: true }, // e.g., TY-CSE-Batch A
  year: { type: String }, // FE, SE, TE, BE
  department: { type: String },

  students: [{ type: Schema.Types.ObjectId, ref: "Student" }],
  subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
  teachers: [{ type: Schema.Types.ObjectId, ref: "Teacher" }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Batch", BatchSchema);