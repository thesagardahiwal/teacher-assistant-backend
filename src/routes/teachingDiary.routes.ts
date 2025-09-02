import { Router } from "express";
import { addDiaryEntry, getDiaryEntries } from "../controllers/teachingDiary.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/", authMiddleware, addDiaryEntry);
router.get("/", authMiddleware, getDiaryEntries);

export default router;
