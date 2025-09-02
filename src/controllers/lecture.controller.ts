import { Request, Response } from "express";
import LectureSession from "../models/lectureSession.model";
import { createLectureSessionSchema, updateLectureSessionSchema } from "../validations/lecture.validation";

// @desc    Create a new lecture session
export const createLectureSession = async (req: Request, res: Response) => {
  try {
    const parsed = createLectureSessionSchema.parse(req.body);

    // Check if sessionId already exists
    const existing = await LectureSession.findOne({ sessionId: parsed.sessionId });
    if (existing) {
      return res.status(400).json({ msg: "Lecture session with this ID already exists" });
    }

    const lectureSession = new LectureSession({
      sessionId: parsed.sessionId,
      subject: parsed.subject,
      batch: parsed.batch,
      teacher: (req as any).teacher.teacherId, // from authMiddleware
      date: parsed.date,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      topic: parsed.topic,
      diaryNote: parsed.diaryNote,
      status: "Scheduled",
      attendanceTaken: false,
    });

    await lectureSession.save();

    return res.status(201).json({
      msg: "Lecture session created successfully",
      lectureSession,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({
      msg: "Validation or Server Error",
      error: err.message,
    });
  }
};

// @desc    Get all lecture sessions for a teacher
export const getMyLectureSessions = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).teacher.teacherId;
    const sessions = await LectureSession.find({ teacher: teacherId })
      .populate("subject batch")
      .sort({ date: -1 });

    return res.json({ sessions });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ msg: "Server Error" });
  }
};

export const updateLectureSession = async (req: Request, res: Response) => {
  try {
    const parsed = updateLectureSessionSchema.parse(req.body);

    const lectureSession = await LectureSession.findById(parsed.lectureSessionId);
    if (!lectureSession) {
      return res.status(404).json({ msg: "Lecture session not found" });
    }

    // Only the teacher who owns the session (or admin later) can update
    const teacherId = (req as any).teacher.teacherId;
    if (lectureSession.teacher.toString() !== teacherId) {
      return res.status(403).json({ msg: "Not authorized to update this session" });
    }

    // Apply updates
    lectureSession.status = parsed.status;
    if (parsed.status === "Rescheduled") {
      if (parsed.newDate) lectureSession.date = new Date(parsed.newDate);
      if (parsed.newStartTime) lectureSession.startTime = parsed.newStartTime;
      if (parsed.newEndTime) lectureSession.endTime = parsed.newEndTime;
    }
    if (parsed.topic) lectureSession.topic = parsed.topic;
    if (parsed.diaryNote) lectureSession.diaryNote = parsed.diaryNote;

    await lectureSession.save();

    return res.json({
      msg: `Lecture session ${parsed.status.toLowerCase()} successfully`,
      lectureSession,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({
      msg: "Validation or Server Error",
      error: err.message,
    });
  }
};
