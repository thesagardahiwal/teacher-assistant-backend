import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Teacher from "../models/teacher.model"; // Assuming your Mongoose model

dotenv.config();

// @desc    Register a new teacher
export const registerTeacher = async (req: Request, res: Response) => {
    const { name, email, phone, password, department, teacherId } = req.body;

    try {
        // Check if teacher already exists
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ msg: "Teacher already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new teacher
        const newTeacher = new Teacher({
            teacherId,
            name,
            email,
            phone,
            department,
            passwordHash: hashedPassword,
            role: "Teacher",
        });

        await newTeacher.save();

        return res.status(201).json({
            msg: "Teacher registered successfully",
            teacher: {
                id: newTeacher._id,
                teacherId: newTeacher.teacherId,
                name: newTeacher.name,
                email: newTeacher.email,
                department: newTeacher.department,
                role: newTeacher.role,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Server Error" });
    }
};

// @desc    Login teacher
export const loginTeacher = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        // Find teacher
        const teacher = await Teacher.findOne({ email });
        if (!teacher) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, teacher.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // Generate JWT
        const payload = { teacherId: teacher._id, role: teacher.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
            expiresIn: "1d",
        });

        res.cookie("auth-token", token, {
            httpOnly: true, // secure from JS access
            secure: process.env.NODE_ENV === "production",
            path: "/",
        });

        return res.json({
            msg: "Login successful",
            token,
            teacher: {
                id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                department: teacher.department,
                role: teacher.role,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Server Error" });
    }
};


export const getDetails = async (req: Request, res: Response) => {
    if (!req.teacher || !req.teacher.teacherId) {
        return res.status(401).json({ msg: "Unauthorized" });
    };

    const teacher = await Teacher.findById(req.teacher.teacherId).select("-passwordHash");
    if (!teacher) {
        return res.status(404).json({ msg: "Teacher not found" });
    };

    return res.json({msg: "Teacher details fetched", teacher: teacher });
};

export const updateDetails = async (req: Request, res: Response) => {
    if (!req.teacher || !req.teacher.teacherId) {
        return res.status(401).json({ msg: "Unauthorized" });
    };

    try {
        const updates = req.body;
        if (updates.password) {
            const salt = await bcrypt.genSalt(10);
            updates.passwordHash = await bcrypt.hash(updates.password, salt);
            delete updates.password;
        }

        const teacher = await Teacher.findByIdAndUpdate(req.teacher.teacherId, updates, { new: true }).select("-passwordHash");
        if (!teacher) {
            return res.status(404).json({ msg: "Teacher not found" });
        };

        return res.json({ msg: "Teacher details updated", teacher: teacher });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Server Error" });
    }
};