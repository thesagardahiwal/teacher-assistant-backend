import { Schema, model, Document, Types } from "mongoose";

export interface ITopic {
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: Date;
  proofs: string[]; // URLs of PPTs, notes, videos
  completedBy?: Types.ObjectId; // Teacher reference
}

export interface IModule {
  title: string;
  topics: ITopic[];
}

export interface ISyllabus extends Document {
  subject: Types.ObjectId; // Subject ID
  batch: Types.ObjectId;   // Batch ID
  modules: IModule[];
  createdAt: Date;
  updatedAt: Date;
  getProgress: () => {
    totalTopics: number;
    completedTopics: number;
    completionRate: number;
  };
}

const TopicSchema = new Schema<ITopic>({
  title: { type: String, required: true },
  description: { type: String },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  proofs: [{ type: String }],
  completedBy: { type: Schema.Types.ObjectId, ref: "Teacher" }
});

const ModuleSchema = new Schema<IModule>({
  title: { type: String, required: true },
  topics: [TopicSchema]
});

const SyllabusSchema = new Schema<ISyllabus>(
  {
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    modules: [ModuleSchema]
  },
  { timestamps: true }
);

SyllabusSchema.methods.getProgress = function () {
  let totalTopics = 0;
  let completedTopics = 0;

  this.modules.forEach((m: IModule) => {
    m.topics.forEach((t: ITopic) => {
      totalTopics++;
      if (t.isCompleted) completedTopics++;
    });
  });

  const completionRate = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

  return { totalTopics, completedTopics, completionRate };
};

export const Syllabus = model<ISyllabus>("Syllabus", SyllabusSchema);

