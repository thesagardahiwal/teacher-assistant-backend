// models/Student.ts
import mongoose, { Schema } from "mongoose";


const StudentSchema = new Schema({
  studentId: { type: String, unique: true, required: true },
  rollNumber: { type: String, required: true },
  enrollmentNumber: { type: String },
  name: { type: String, required: true },
  email: { type: String, unique: true },
  phone: { type: String },

  batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
  guardian: {
    name: String,
    phone: String,
    email: String
  },

  attendanceStats: {
    totalLectures: { type: Number, default: 0 },
    attendedLectures: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },

  performance: [{
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },
    assessmentType: { type: String }, // Quiz, Test, Assignment
    marksObtained: Number,
    totalMarks: Number,
    date: Date
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


export default mongoose.model('Student', StudentSchema);