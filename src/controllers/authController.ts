// controllers/authController.ts

import Teacher from '../models/Teacher';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { response } from '../utils/response';
import { Request, Response } from 'express';

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        const exists = await Teacher.findOne({ email });
        if (exists) return res.status(400).json(response({
            message: "Email already registered",
            status: 400,
            data: null,
            success: false
        }));

        const hashed = await bcrypt.hash(password, 10);
        const teacher = await Teacher.create({ name, email, password: hashed });
        res.status(201).json(response({
            message: "Registration successful",
            status: 201,
            data: ({...teacher, password: '***'}), // Exclude password from response
            success: true
        }));
    } catch (error) {
        res.status(500).json(response({
            message: error instanceof Error ? error.message : "Registration error",
            status: 500,
            data: null,
            success: false
        }));
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const teacher = await Teacher.findOne({ email });
        if (!teacher) return res.status(400).json(response({
            message: "Invalid credentials",
            status: 400,
            data: null,
            success: false
        }));
        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) return res.status(400).json(response({
            message: "Invalid credentials",
            status: 400,
            data: null,
            success: false
        }));
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        const token = jwt.sign({ id: teacher._id }, jwtSecret, { expiresIn: '1d' });
        res.cookie('auth-token', token, {
            httpOnly: true,
            secure: false,         // since localhost is not HTTPS
            sameSite: 'lax',       // allow cross-origin with some protection
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json(response({
            message: "Login successful",
            status: 200,
            data: { teacher: { ...teacher.toObject(), password: '***' } }, // Exclude password from response
            success: true
        }));
    } catch (error) {
        res.status(500).json(response({
            message: error instanceof Error ? error.message : "Login error",
            status: 500,
            data: null,
            success: false
        }));
    }
};