import { Request, Response } from "express";
import { Syllabus } from "../models/syllabus.model";

export const createSyllabus = async (req: Request, res: Response) => {
  try {
    const syllabus = await Syllabus.create(req.body);
    res.status(201).json({ msg: "Syllabus created", syllabus });
  } catch (err: any) {
    res.status(500).json({ msg: "Error creating syllabus", error: err.message });
  }
};


export const markTopicCompleted = async (req: Request, res: Response) => {
  try {
    const { syllabusId, moduleIndex, topicIndex } = req.params;
    const { proofs, notes } = req.body;

    const modIdx = parseInt(moduleIndex, 10);
    const topIdx = parseInt(topicIndex, 10);
    if (!req.teacher?.teacherId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const syllabus = await Syllabus.findById(syllabusId);
    if (!syllabus) return res.status(404).json({ msg: "Syllabus not found" });

    syllabus.modules[modIdx].topics[topIdx].isCompleted = true;
    syllabus.modules[modIdx].topics[topIdx].completedAt = new Date();
    syllabus.modules[modIdx].topics[topIdx].proofs = proofs || [];
    syllabus.modules[modIdx].topics[topIdx].completedBy = new (require("mongoose").Types.ObjectId)(req.teacher?.teacherId);

    await syllabus.save();
    res.json({ msg: "Topic marked as completed", syllabus });
  } catch (err: any) {
    res.status(500).json({ msg: "Error updating topic", error: err.message });
  }
};

export const getSyllabusProgress = async (req: Request, res: Response) => {
  try {
    const { syllabusId } = req.params;
    const syllabus = await Syllabus.findById(syllabusId).populate("subject batch");

    if (!syllabus) return res.status(404).json({ msg: "Syllabus not found" });

    const progress = syllabus.getProgress();

    res.json({ syllabus, ...progress });
  } catch (err: any) {
    res.status(500).json({ msg: "Error fetching syllabus progress", error: err.message });
  }
};
