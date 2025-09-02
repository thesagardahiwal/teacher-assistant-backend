import { Request, Response } from "express";
import Leave from "../models/leave.model";
import TeacherAttendance from "../models/teacherAttendace.model";
import Teacher from "../models/teacher.model";

// @desc Apply for leave
export const applyLeave = async (req: Request, res: Response) => {
  try {
    const { teacherId, startDate, endDate, reason } = req.body;

    const leave = new Leave({ teacher: teacherId, startDate, endDate, reason });
    await leave.save();

    res.status(201).json({ msg: "Leave request submitted", leave });
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Approve or reject leave
export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body; // Approved | Rejected
    const adminId = req.teacher?.teacherId;

    const leave = await Leave.findById(leaveId);
    if (!leave) return res.status(404).json({ msg: "Leave request not found" });
    if (!adminId) return res.status(403).json({ msg: "Unauthorized" });
    leave.status = status;
    leave.approvedBy = new (require("mongoose").Types.ObjectId)(adminId);
    await leave.save();

    // If approved → auto-mark teacher attendance as "On Leave"
    if (status === "Approved") {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      const days = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }

      for (const day of days) {
        // Check if already marked
        const existing = await TeacherAttendance.findOne({
          teacher: leave.teacher,
          date: day,
        });

        if (!existing) {
          await TeacherAttendance.create({
            teacher: leave.teacher,
            date: day,
            status: "On Leave",
            markedBy: adminId,
            remarks: "Auto-marked due to leave approval",
          });
        }
      }
    }

    res.json({ msg: `Leave ${status}`, leave });
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};
