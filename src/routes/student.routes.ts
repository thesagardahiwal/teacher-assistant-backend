// routes/student.routes.ts
import express from 'express';
import { 
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudents
} from '../controllers/student.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Public routes (if any)
// router.get('/', getAllStudents);

// Protected routes
router.get('/', authMiddleware, getAllStudents); // Get all students with filters
router.get('/:id', authMiddleware, getStudentById); // Get student by ID
router.post('/', authMiddleware, createStudent); // Create single student
router.post('/import', authMiddleware, importStudents); // Bulk import
router.put('/:id', authMiddleware, updateStudent); // Update student
router.delete('/:id', authMiddleware, deleteStudent); // Delete student

export default router;