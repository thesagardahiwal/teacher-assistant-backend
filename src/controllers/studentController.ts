import { Request, Response } from 'express';
import Student from '../models/Student';
import { response } from '../utils/response';

export const createStudent = async (req: Request, res: Response) => {
    try {
        const { rollNumber, name, email, classrooms, customFields } = req.body;

        const student = new Student({
            rollNumber,
            name,
            email,
            classrooms,
            customFields: customFields?.map((field: any) => ({
                fieldName: field.fieldName,
                value: field.value,
                fieldType: field.fieldType || 'string'
            }))
        });

        await student.save();
        res.status(201).json(response({
            data: student,
            status: 201,
            message: 'Student created successfully',
            success: true
        }));
    } catch (error) {
        res.status(400).json(response({
            status: 500,
            message: error instanceof Error ? error.message : "Error creating student",
            data: null,
            success: false
        }));
    }
};

export const getStudents = async (req: Request, res: Response) => {
    try {
        const students = await Student.find().populate('classrooms.id');
        res.json(students);
    } catch (error) {
        res.status(500).json(response({
            status: 500,
            message: error instanceof Error ? error.message : "Error fetching students",
            data: null,
            success: false
        }));
    }
};

export const getStudentById = async (req: Request, res: Response) => {
    try {
        const student = await Student.findById(req.params.id).populate('classrooms.id');
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(response({
            data: student,
            status: 200,
            message: 'Student fetched successfully',
            success: true
        }));
    } catch (error) {
        res.status(500).json(response({
            status: 500,
            message: error instanceof Error ? error.message : "Error fetching student",
            data: null,
            success: false
        }));
    }
};

export const updateStudent = async (req: Request, res: Response) => {
    try {
        const { name, email, classrooms, customFields } = req.body;

        const student = await Student.findByIdAndUpdate(
            req.params.id,
            {
                name,
                email,
                classrooms,
                customFields: customFields?.map((field: any) => ({
                    fieldName: field.fieldName,
                    value: field.value,
                    fieldType: field.fieldType || 'string'
                }))
            },
            { new: true, runValidators: true }
        ).populate('classrooms.id');

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(response({
            data: student,
            status: 200,
            message: 'Student updated successfully',
            success: true
        }));
    } catch (error) {
        res.status(400).json(response({
            status: 500,
            message: error instanceof Error ? error.message : "Error updating student",
            data: null,
            success: false
        }));
    }
};

export const deleteStudent = async (req: Request, res: Response) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(response({
            data: null,
            status: 200,
            message: 'Student deleted successfully',
            success: true
        }));
    } catch (error) {
        res.status(500).json(response({
            status: 500,
            message: error instanceof Error ? error.message : "Error deleting student",
            data: null,
            success: false
        }));
    }
};

export const importStudents = async (req: Request, res: Response) => {
    try {
        const { students } = req.body;

        if (!Array.isArray(students)) {
            return res.status(400).json({ error: 'Invalid student data format' });
        }

        const docs = students.map(student => {
            const { rollNumber, name, email, classrooms, ...customFields } = student;

            return {
                rollNumber,
                name,
                email,
                classrooms,
                customFields: Object.entries(customFields).map(([fieldName, value]) => ({
                    fieldName,
                    value,
                    fieldType: determineFieldType(value)
                }))
            };
        });

        const result = await Student.insertMany(docs, { ordered: false });
        res.json(response({
            data: {
                importedCount: result.length,
                duplicates: students.length - result.length
            },
            status: 201,
            message: 'Students imported successfully',
            success: true
        }));
    } catch (error) {
        res.status(400).json(response({
            message: (error as Error).message || 'Import failed',
            status: 400,
            success: false,
            data: null
        }));
    }
};

function determineFieldType(value: any): string {
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (value === null || value === undefined) return 'string';

    switch (typeof value) {
        case 'string': return 'string';
        case 'number': return 'number';
        case 'boolean': return 'boolean';
        case 'object': return 'object';
        default: return 'string';
    }
}