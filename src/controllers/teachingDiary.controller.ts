import { Request, Response } from "express";
import { TeachingDiary } from "../models/teachingDiary.model";
import { Syllabus } from "../models/syllabus.model";

export const addDiaryEntry = async (req: Request, res: Response) => {
  try {
    const { teacher, batch, subject, lectureDate, topicsCovered, notes, proofs } = req.body;

    const diary = await TeachingDiary.create({
      teacher,
      batch,
      subject,
      lectureDate,
      topicsCovered,
      notes,
      proofs
    });

    // 🔹 Auto-sync with syllabus
    if (topicsCovered && topicsCovered.length > 0) {
      const syllabus = await Syllabus.findOne({ subject, batch });
      if (syllabus) {
        topicsCovered.forEach((tc: { topicId: string }) => {
          syllabus.modules.forEach(m => {
            m.topics.forEach(t => {
              if ((t as any)._id.toString() === tc.topicId.toString()) {
                t.isCompleted = true;
                t.completedAt = new Date();
                t.completedBy = teacher;
              }
            });
          });
        });
        await syllabus.save();
      }
    }

    res.status(201).json({ msg: "Diary entry added", diary });
  } catch (err: any) {
    res.status(500).json({ msg: "Error creating diary entry", error: err.message });
  }
};

export const getDiaryEntries = async (req: Request, res: Response) => {
  try {
    const { teacherId, subjectId, batchId, startDate, endDate } = req.query;

    const query: any = {};
    if (teacherId) query.teacher = teacherId;
    if (subjectId) query.subject = subjectId;
    if (batchId) query.batch = batchId;
    if (startDate && endDate) {
      query.lectureDate = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    const diaries = await TeachingDiary.find(query)
      .populate("teacher", "name email")
      .populate("subject", "name code")
      .populate("batch", "name year");

    res.json({ count: diaries.length, diaries });
  } catch (err: any) {
    res.status(500).json({ msg: "Error fetching diary entries", error: err.message });
  }
};
