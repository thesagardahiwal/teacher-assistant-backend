import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { applyLeave, updateLeaveStatus } from "../controllers/leave.controller";

const router = Router();

// @route POST /api/leaves/apply
router.post("/apply", authMiddleware, applyLeave);

// @route PUT /api/leaves/:leaveId/status
router.put("/:leaveId/status", authMiddleware, updateLeaveStatus);

export default router;
