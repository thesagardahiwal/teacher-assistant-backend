import { Schema, model, Document } from "mongoose";

export interface IAttendance extends Document {
  sessionId: string; // custom ID
  subject: Schema.Types.ObjectId;
  batch: Schema.Types.ObjectId;
  teacher: Schema.Types.ObjectId;
  date: Date;
  presentStudents: Schema.Types.ObjectId[];
  absentStudents: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    sessionId: { type: String, unique: true, required: true },

    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },

    date: { type: Date, required: true },

    presentStudents: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    absentStudents: [{ type: Schema.Types.ObjectId, ref: "Student" }],
  },
  { timestamps: true }
);

export default model<IAttendance>("Attendance", AttendanceSchema);
