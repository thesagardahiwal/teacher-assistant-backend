// models/Student.ts

import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema({
  name: String,
  rollNumber: String,
  email: String,
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }
}, { timestamps: true });

export default mongoose.model('Student', StudentSchema);
