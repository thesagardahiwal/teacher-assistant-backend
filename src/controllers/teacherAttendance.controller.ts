import { Request, Response } from "express";
import TeacherAttendance from "../models/teacherAttendace.model";
import Teacher from "../models/teacher.model";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Teacher {
      teacherId: string; 
      role: string;
      // add other properties if needed
    }
    interface Request {
      teacher?: Teacher;
    }
  }
}

// @desc Mark teacher attendance
export const markTeacherAttendance = async (req: Request, res: Response) => {
  try {
    const { teacherId, date, status, remarks } = req.body;
    const markedBy = req.teacher?.teacherId; // from auth middleware

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ msg: "Teacher not found" });

    // Prevent duplicate marking for same date
    const existing = await TeacherAttendance.findOne({ teacher: teacherId, date });
    if (existing) {
      return res.status(400).json({ msg: "Attendance already marked for this date" });
    }

    const attendance = new TeacherAttendance({
      teacher: teacherId,
      date,
      status,
      remarks,
      markedBy,
    });

    await attendance.save();

    res.status(201).json({ msg: "Teacher attendance marked", attendance });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Get teacher attendance by date
export const getTeacherAttendanceByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    const attendance = await TeacherAttendance.find({ date }).populate("teacher", "name email");
    res.json(attendance);
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Get teacher attendance summary
export const getTeacherAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;

    const records = await TeacherAttendance.find({ teacher: teacherId });

    const total = records.length;
    const present = records.filter(r => r.status === "Present").length;
    const absent = records.filter(r => r.status === "Absent").length;
    const leave = records.filter(r => r.status === "On Leave").length;

    res.json({
      teacherId,
      totalDays: total,
      present,
      absent,
      leave,
      attendancePercentage: total > 0 ? ((present / total) * 100).toFixed(2) : "0.00",
    });
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};
