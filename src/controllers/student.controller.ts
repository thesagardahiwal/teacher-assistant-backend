import { Request, Response } from "express";
import Student from "../models/subject.model";
import Batch from "../models/batch.model";
import { studentArraySchema } from "../validations/student.validation";

// @desc    Import Students (JSON from frontend)
export const importStudents = async (req: Request, res: Response) => {
  try {
    // Validate incoming JSON
    const parsedStudents = studentArraySchema.parse(req.body.students);

    const inserted: any[] = [];
    const failed: any[] = [];
    const duplicates: any[] = [];

    for (const student of parsedStudents) {
      try {
        // Check duplicate
        const existing = await Student.findOne({
          rollNumber: student.rollNumber,
          batch: student.batch,
        });

        if (existing) {
          duplicates.push(student);
          continue;
        }

        // Ensure batch exists or create it
        let batch = await Batch.findOne({ name: student.batch });
        if (!batch) {
          batch = new Batch({
            batchId: student.batch,
            name: student.batch,
            department: student.department,
          });
          await batch.save();
        }

        // Save student
        const newStudent = new Student({
          ...student,
          batch: batch._id,
        });
        await newStudent.save();

        inserted.push(student);
      } catch (err: any) {
        failed.push({ student, error: err.message });
      }
    }

    return res.json({
      msg: "Student import completed",
      summary: {
        inserted: inserted.length,
        duplicates: duplicates.length,
        failed: failed.length,
      },
      details: { inserted, duplicates, failed },
    });
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({
      msg: "Validation Error",
      errors: error.errors || error.message,
    });
  }
};

// @desc Import students (JSON from frontend) into a batch
export const importStudentsToBatch = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { students } = req.body; // Array of student objects

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ msg: "Batch not found" });

    const insertedStudents = [];
    for (const s of students) {
      const student = new Student({
        name: s.name,
        rollNumber: s.rollNumber,
        email: s.email,
        batch: batch._id,
        department: batch.department,
        year: batch.year
      });
      await student.save();

      batch.students.push(student._id as any);
      insertedStudents.push(student);
    }

    await batch.save();

    res.status(201).json({
      msg: `${insertedStudents.length} students imported successfully`,
      students: insertedStudents
    });

  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Add single student to batch
export const addStudentToBatch = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { name, rollNumber, email } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ msg: "Batch not found" });

    const student = new Student({
      name,
      rollNumber,
      email,
      batch: batch._id,
      department: batch.department,
      year: batch.year
    });

    await student.save();

    batch.students.push(student._id as any);
    await batch.save();

    res.status(201).json({ msg: "Student added successfully", student });
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// @desc Remove student from batch
export const removeStudentFromBatch = async (req: Request, res: Response) => {
  try {
    const { batchId, studentId } = req.params;

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ msg: "Batch not found" });

    batch.students = batch.students.filter((s: any) => s.toString() !== studentId);
    await batch.save();

    await Student.findByIdAndDelete(studentId);

    res.json({ msg: "Student removed successfully" });
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};