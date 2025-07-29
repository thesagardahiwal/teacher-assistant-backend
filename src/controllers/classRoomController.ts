import { Request, Response } from 'express';

import Teacher from '../models/Teacher';
import ClassRoom from '../models/ClassRoom';
import { response } from '../utils/response';

export const createClassroom = async (req: Request, res: Response) => {
    try {
        const { subject, teacherId } = req.body;

        if (!subject || !teacherId) {
            return res.status(400).json(response({
                status: 400,
                message: 'Subject and teacherId are required',
                data: null,
                success: false
            }));
        }

        // Optional: validate if teacher exists
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json(response({
                status: 404,
                message: 'Teacher not found',
                data: null,
                success: false
            }));
        }

        const newClassroom = await ClassRoom.create({
            subject,
            teacher: teacherId,
        });

        return res.status(201).json(response({
            status: 201,
            message: 'Classroom created successfully',
            data: newClassroom,
            success: true
        }));
    } catch (error: any) {
        return res.status(500).json(response({
            status: 500,
            message: error.message || 'Internal Server Error',
            data: null,
            success: false
        }));
    }
};

export const getClassroomsByTeacher = async (req: Request, res: Response) => {
    try {
        const { teacherId } = req.params;

        const classrooms = await ClassRoom.find({ teacher: teacherId }).populate('students');

        return res.status(200).json(response({
            status: 200,
            message: 'Classrooms retrieved successfully',
            data: classrooms,
            success: true
        }));
    } catch (error: any) {
        return res.status(500).json(response({
            status: 500,
            message: error.message || 'Internal Server Error',
            data: null,
            success: false
        }));
    }
};
export const addStudentToClassroom = async (req: Request, res: Response) => {
    try {
        const { classroomId, studentId } = req.body;

        if (!classroomId || !studentId) {
            return res.status(400).json(response({
                status: 400,
                message: 'Classroom ID and Student ID are required',
                data: null,
                success: false
            }));
        }

        const classroom = await ClassRoom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json(response({
                status: 404,
                message: 'Classroom not found',
                data: null,
                success: false
            }));
        }

        if (classroom.students.includes(studentId)) {
            return res.status(400).json(response({
                status: 400,
                message: 'Student already enrolled in this classroom',
                data: null,
                success: false
            }));
        }

        classroom.students.push(studentId);
        await classroom.save();

        return res.status(200).json(response({
            status: 200,
            message: 'Student added to classroom successfully',
            data: classroom,
            success: true
        }));
    } catch (error: any) {
        return res.status(500).json(response({
            status: 500,
            message: error.message || 'Internal Server Error',
            data: null,
            success: false
        }));
    }
};

export const removeStudentFromClassroom = async (req: Request, res: Response) => {
    try {
        const { classroomId, studentId } = req.body;

        if (!classroomId || !studentId) {
            return res.status(400).json(response({
                status: 400,
                message: 'Classroom ID and Student ID are required',
                data: null,
                success: false
            }));
        }

        const classroom = await ClassRoom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json(response({
                status: 404,
                message: 'Classroom not found',
                data: null,
                success: false
            }));
        }

        classroom.students = classroom.students.filter(id => id.toString() !== studentId);
        await classroom.save();

        return res.status(200).json(response({
            status: 200,
            message: 'Student removed from classroom successfully',
            data: classroom,
            success: true
        }));
    } catch (error: any) {
        return res.status(500).json(response({
            status: 500,
            message: error.message || 'Internal Server Error',
            data: null,
            success: false
        }));
    }
};

export const deleteClassroom = async (req: Request, res: Response) => {
    try {
        const { classroomId } = req.params;

        if (!classroomId) {
            return res.status(400).json(response({
                status: 400,
                message: 'Classroom ID is required',
                data: null,
                success: false
            }));
        }

        const classroom = await ClassRoom.findByIdAndUpdate(classroomId, { $set: { deleted: true } }, { new: true });
        if (!classroom) {
            return res.status(404).json(response({
                status: 404,
                message: 'Classroom not found',
                data: null,
                success: false
            }));
        }

        return res.status(200).json(response({
            status: 200,
            message: 'Classroom deleted successfully',
            data: null,
            success: true
        }));
    } catch (error: any) {
        return res.status(500).json(response({
            status: 500,
            message: error.message || 'Internal Server Error',
            data: null,
            success: false
        }));
    }
};