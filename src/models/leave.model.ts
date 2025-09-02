import { Schema, model, Document } from "mongoose";

export interface ILeave extends Document {
  teacher: Schema.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  approvedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

export default model<ILeave>("Leave", LeaveSchema);
