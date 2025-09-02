import { Schema, model, Document } from "mongoose";

export interface ITeacher extends Document {
  teacherId: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  department: string;
  designation?: string;
  subjects: Schema.Types.ObjectId[];
  batches: Schema.Types.ObjectId[];
  role: "Teacher" | "Admin" | "Principal";
  leaveBalance: {
    casual: number;
    sick: number;
    earned: number;
  };
  profilePic?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    teacherId: { type: String, unique: true, required: false }, // can auto-gen if not given
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String },
    passwordHash: { type: String, required: true },

    department: { type: String, required: true },
    designation: { type: String },

    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    batches: [{ type: Schema.Types.ObjectId, ref: "Batch" }],

    role: {
      type: String,
      enum: ["Teacher", "Admin", "Principal"],
      default: "Teacher",
    },

    leaveBalance: {
      casual: { type: Number, default: 10 },
      sick: { type: Number, default: 7 },
      earned: { type: Number, default: 5 },
    },

    profilePic: { type: String },

  },
  { timestamps: true } // auto adds createdAt & updatedAt
);

export default model<ITeacher>("Teacher", TeacherSchema);
