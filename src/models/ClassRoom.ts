// models/Classroom.ts

import mongoose from "mongoose";

const ClassroomSchema = new mongoose.Schema({
  subject: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Classroom', ClassroomSchema);
