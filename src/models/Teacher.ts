// models/Teacher.ts

import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: {type: String, required: true},
  classrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }]
}, { timestamps: true });

export default mongoose.model('Teacher', TeacherSchema);
