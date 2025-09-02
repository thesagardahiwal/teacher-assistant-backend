import { Request, Response } from "express";
import Subject from "../models/subject.model";
import Batch from "../models/batch.model";

// @desc Create a subject
export const createSubject = async (req: Request, res: Response) => {
  try {
    const { name, code, department, year, semester, credits, description, batchId, teacherId } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ msg: "Batch not found" });

    const subject = new Subject({
      name,
      code,
      department,
      year,
      semester,
      credits,
      description,
      batch: batch._id,
      teacher: teacherId
    });

    await subject.save();

    batch.subjects.push(subject._id as any);
    await batch.save();

    res.status(201).json({ msg: "Subject created successfully", subject });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// @desc Get all subjects for a batch
export const getBatchSubjects = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const subjects = await Subject.find({ batch: batchId }).populate("teacher", "name email");
    res.json(subjects);
  } catch (err: any) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// @desc Update subject details
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    const updates = req.body;
    const subject = await Subject.findByIdAndUpdate(subjectId, updates, { new: true });
    if (!subject) return res.status(404).json({ msg: "Subject not found" });
    res.json({ msg: "Subject updated", subject });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// @desc Delete subject
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    const subject = await Subject.findByIdAndDelete(subjectId);
    if (!subject) return res.status(404).json({ msg: "Subject not found" });
    res.json({ msg: "Subject deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
