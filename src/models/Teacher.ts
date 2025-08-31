import mongoose, { Schema } from "mongoose";

const TeacherSchema = new Schema({
  teacherId: { type: String, unique: true, required: true }, // custom ID
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String },
  passwordHash: { type: String, required: true },

  designation: { type: String }, // Lecturer, Assistant Prof, etc
  department: { type: String },
  subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
  batches: [{ type: Schema.Types.ObjectId, ref: "Batch" }],

  role: { type: String, enum: ["Teacher", "Admin", "Principal"], default: "Teacher" },
  leaveBalance: {
    casual: { type: Number, default: 10 },
    sick: { type: Number, default: 7 },
    earned: { type: Number, default: 5 },
  },

  profilePic: { type: String }, // URL
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Teacher", TeacherSchema);
