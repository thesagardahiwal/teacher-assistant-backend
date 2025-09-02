import { Schema, model, Document, Types } from "mongoose";

export interface ITeachingDiary extends Document {
  teacher: Types.ObjectId;
  batch: Types.ObjectId;
  subject: Types.ObjectId;
  lectureDate: Date;
  topicsCovered: { moduleId: Types.ObjectId; topicId: Types.ObjectId; title: string }[];
  notes?: string;
  proofs?: string[]; // PPT, notes, video links
  createdAt: Date;
}

const TeachingDiarySchema = new Schema<ITeachingDiary>(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    lectureDate: { type: Date, default: Date.now },
    topicsCovered: [
      {
        moduleId: { type: Schema.Types.ObjectId },
        topicId: { type: Schema.Types.ObjectId },
        title: { type: String }
      }
    ],
    notes: { type: String },
    proofs: [{ type: String }]
  },
  { timestamps: true }
);

export const TeachingDiary = model<ITeachingDiary>("TeachingDiary", TeachingDiarySchema);
