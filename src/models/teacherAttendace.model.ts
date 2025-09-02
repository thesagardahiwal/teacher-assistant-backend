import { Schema, model, Document } from "mongoose";

export interface ITeacherAttendance extends Document {
  teacher: Schema.Types.ObjectId;
  date: Date;
  status: "Present" | "Absent" | "On Leave";
  markedBy: Schema.Types.ObjectId; // could be self or admin
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherAttendanceSchema = new Schema<ITeacherAttendance>(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Present", "Absent", "On Leave"],
      required: true,
    },
    markedBy: { type: Schema.Types.ObjectId, ref: "Teacher" }, // or Admin
    remarks: { type: String },
  },
  { timestamps: true }
);

export default model<ITeacherAttendance>("TeacherAttendance", TeacherAttendanceSchema);
