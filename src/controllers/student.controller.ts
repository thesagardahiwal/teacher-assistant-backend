import { Request, Response } from "express";
import Student from "../models/student.model";
import Batch from "../models/batch.model";
import { studentArraySchema } from "../validations/student.validation";

// @desc    Import Students (JSON from frontend)
export const importStudents = async (req: Request, res: Response) => {
  try {
    const items = req.body.students;

    if (!Array.isArray(items)) {
      return res.status(400).json({ msg: "Invalid payload: 'students' must be an array" });
    }

    // Normalize phone numbers
    const validatedStudents = items.map((student: any) => ({
      ...student,
      phone: student.phone?.replace(/\D/g, '').slice(-10) || '',
      guardian: {
        ...student.guardian,
        phone: student.guardian?.phone?.replace(/\D/g, '').slice(-10) || ''
      }
    }));

    // Use STUDENT schema, not subject schema
    const parsedStudents = studentArraySchema.parse(validatedStudents);

    const inserted: any[] = [];
    const failed: any[] = [];
    const duplicates: any[] = [];

    for (const student of parsedStudents) {
      try {
        // Check duplicate
        const existing = await Student.findOne({
          $or: [
            { rollNumber: student.rollNumber, batch: student.batch },
            { enrollmentNumber: student.enrollmentNumber }
          ]
        });

        if (existing) {
          duplicates.push(student);
          continue;
        }

        // Ensure batch exists
        let batch = await Batch.findById(student.batch);
        if (!batch) {
          failed.push({ student, error: "Batch not found" });
          continue;
        }

        // Save student
        const newStudent = new Student({
          ...student,
          batch: batch._id,
        });
        await newStudent.save();

        await Batch.findByIdAndUpdate(
          student.batch,
          { $push: { students: newStudent._id } },
          { new: true }
        );
        
        inserted.push(student);
      } catch (err: any) {
        failed.push({ student, error: err.message });
      }
    }

    return res.json({
      msg: "Student import completed",
      data: {
        summary: {
          inserted: inserted.length,
          duplicates: duplicates.length,
          failed: failed.length,
        },
        details: { inserted, duplicates, failed },
      }
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return res.status(400).json({
      msg: "Validation Error",
      errors: error.errors || error.message,
    });
  }
};

// Get student by ID
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id)
      .populate('batch', 'name year department batchId')
      .populate('performance.subjectId', 'name code');

    if (!student) {
      return res.status(404).json({
        success: false,
        msg: 'Student not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: student
    });

  } catch (error: any) {
    console.error('Error fetching student:', error);
    return res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: error.message
    });
  }
};

// Create single student
export const createStudent = async (req: Request, res: Response) => {
  try {
    const studentData = req.body;

    // Check if batch exists
    const batch = await Batch.findById(studentData.batch);
    if (!batch) {
      return res.status(400).json({
        success: false,
        msg: 'Batch not found'
      });
    }

    // Check for duplicate roll number in the same batch
    const existingStudent = await Student.findOne({
      rollNumber: studentData.rollNumber,
      batch: studentData.batch
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        msg: 'Student with this roll number already exists in this batch'
      });
    }

    // Check for duplicate enrollment number
    const existingEnrollment = await Student.findOne({
      enrollmentNumber: studentData.enrollmentNumber
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        msg: 'Student with this enrollment number already exists'
      });
    }

    const student = new Student({
      ...studentData,
      batch: batch._id
    });

    await student.save();

    // Populate the saved student
    const populatedStudent = await Student.findById(student._id)
      .populate('batch', 'name year department batchId');

    return res.status(201).json({
      success: true,
      msg: 'Student created successfully',
      data: populatedStudent
    });

  } catch (error: any) {
    console.error('Error creating student:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        msg: 'Validation Error',
        errors: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: error.message
    });
  }
};

// Update student
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if student exists
    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        msg: 'Student not found'
      });
    }

    // If rollNumber is being updated, check for duplicates
    if (updateData.rollNumber && updateData.rollNumber !== existingStudent.rollNumber) {
      const duplicateRoll = await Student.findOne({
        rollNumber: updateData.rollNumber,
        batch: updateData.batch || existingStudent.batch,
        _id: { $ne: id }
      });

      if (duplicateRoll) {
        return res.status(400).json({
          success: false,
          msg: 'Another student with this roll number already exists in this batch'
        });
      }
    }

    // If enrollmentNumber is being updated, check for duplicates
    if (updateData.enrollmentNumber && updateData.enrollmentNumber !== existingStudent.enrollmentNumber) {
      const duplicateEnrollment = await Student.findOne({
        enrollmentNumber: updateData.enrollmentNumber,
        _id: { $ne: id }
      });

      if (duplicateEnrollment) {
        return res.status(400).json({
          success: false,
          msg: 'Another student with this enrollment number already exists'
        });
      }
    }

    // If batch is being updated, verify the new batch exists
    if (updateData.batch && updateData.batch !== existingStudent.batch.toString()) {
      const batch = await Batch.findById(updateData.batch);
      if (!batch) {
        return res.status(400).json({
          success: false,
          msg: 'Batch not found'
        });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('batch', 'name year department batchId')
     .populate('performance.subjectId', 'name code');

    return res.status(200).json({
      success: true,
      msg: 'Student updated successfully',
      data: updatedStudent
    });

  } catch (error: any) {
    console.error('Error updating student:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        msg: 'Validation Error',
        errors: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: error.message
    });
  }
};

// Delete student
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        msg: 'Student not found'
      });
    }

    await Student.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      msg: 'Student deleted successfully',
      data: {
        deletedId: id,
        studentName: student.name,
        rollNumber: student.rollNumber
      }
    });

  } catch (error: any) {
    console.error('Error deleting student:', error);
    return res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: error.message
    });
  }
};

export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const { year, department, batch, page = '1', limit = '10', search } = req.query;
    const pathYear = req.params.year;

    // Use year from path params if available, otherwise from query params
    const filterYear = pathYear || year;
    
    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: any = {};

    // If year is provided, find batches with that year and get their IDs
    if (filterYear) {
      const batches = await Batch.find({ year: filterYear }).select('_id');
      const batchIds = batches.map(b => b._id);
      filter.batch = { $in: batchIds };
    }

    // Filter by department if provided
    if (department) {
      filter.department = { $regex: department, $options: 'i' }; // Case-insensitive
    }

    // Filter by specific batch ID if provided
    if (batch) {
      filter.batch = batch; // This will override the year filter if both provided
    }

    // Search across multiple fields if search term provided
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { enrollmentNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Filter criteria:', filter);

    // Get total count for pagination
    const totalStudents = await Student.countDocuments(filter);
    
    // Fetch students with population and sorting
    let students;
    
    if (Object.keys(filter).length === 0) {
      // No filters - get recent 10 students
      students = await Student.find()
        .populate('batch', 'name year department')
        .sort({ createdAt: -1 }) // Most recent first
        .limit(limitNum)
        .skip(skip);
    } else {
      // With filters - apply pagination
      students = await Student.find(filter)
        .populate('batch', 'name year department')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalStudents / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      data: {
        students: students,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalStudents,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? pageNum + 1 : null,
          prevPage: hasPrevPage ? pageNum - 1 : null,
          limit: limitNum
        },
        filters: {
          year: filterYear,
          department,
          batch,
          search
        }
      },
    });

  } catch (error: any) {
    console.error('Error fetching students:', error);
    return res.status(500).json({
      success: false,
      msg: "Server Error",
      error: error.message
    });
  }
};

export const importStudent = async (req: Request, res: Response) => {
  try {
    const { name, rollNumber, email, batchId } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ msg: "Batch not found" });

    // Check duplicate
    const existing = await Student.findOne({
      rollNumber,
      batch: batch._id
    });

    if (existing) {
      return res.status(400).json({ msg: "Student with this roll number already exists in the batch" });
    }

    const student = new Student({
      name,
      rollNumber,
      email,
      batch: batch._id,
      department: batch.department,
      year: batch.year
    });

    await student.save();

    res.status(201).json({ msg: "Student added successfully", student });
  } catch (err: any) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  };
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
        enrollmentNumber: s.enrollmentNumber,
        guardian: s.guardian,
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