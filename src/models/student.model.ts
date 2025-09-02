import { Schema, model, Document } from "mongoose";

export interface IStudent extends Document {
  studentId: string;
  rollNumber: string;
  enrollmentNumber?: string;
  name: string;
  email?: string;
  phone?: string;
  batch: Schema.Types.ObjectId; // Reference to Batch
  department: string;
  guardian?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  attendanceStats: {
    totalLectures: number;
    attendedLectures: number;
    percentage: number;
  };
  performance: {
    subjectId: Schema.Types.ObjectId;
    assessmentType: string;
    marksObtained: number;
    totalMarks: number;
    date: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    studentId: { type: String, unique: true, required: false }, // can be auto-generated
    rollNumber: { type: String, required: true },
    enrollmentNumber: { type: String },

    name: { type: String, required: true },
    email: { type: String, unique: false }, // not all students may have email
    phone: { type: String },

    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    department: { type: String, required: true },

    guardian: {
      name: String,
      phone: String,
      email: String,
    },

    attendanceStats: {
      totalLectures: { type: Number, default: 0 },
      attendedLectures: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
    },

    performance: [
      {
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },
        assessmentType: { type: String }, // Assignment, Test, Quiz, Exam
        marksObtained: { type: Number },
        totalMarks: { type: Number },
        date: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

export default model<IStudent>("Student", StudentSchema);
