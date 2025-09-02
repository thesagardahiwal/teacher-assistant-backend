// app.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import cookieParser from 'cookie-parser';
import teacherRoutes from './routes/teacher.routes';
import studentRoutes from './routes/student.routes';
import attendanceRoutes from './routes/attendance.routes';
import lectureRoutes from './routes/lecture.routes';
import teacherAttendanceRoutes from './routes/teacherAttendance.routes';
import leaveRoutes from './routes/leave.routes';
import teacherPerformanceRoutes from './routes/teacherPerformance.routes';
import batchAnalyticsRoutes from './routes/batchAnalytics.routes';
import batchRoutes from './routes/batch.routes';
import batchStudentRoutes from './routes/batchStudent.routes';
import subjectRoutes from './routes/subject.routes';
import assignmentRoutes from './routes/assignment.routes';
import syllabusRoutes from './routes/syllabus.routes';
import teachingDiaryRoutes from './routes/teachingDiary.routes';

dotenv.config();
connectDB();
const app = express();
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000', // Adjust this to your frontend URL
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increase body size limit if needed
app.get('/', (req, res) => {
    res.send('Welcome to the Teacher Assistant API');
});

app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/teacher-attendance', teacherAttendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/teacher-performance', teacherPerformanceRoutes);
app.use('/api/batch-analytics', batchAnalyticsRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/batch-students', batchStudentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/teaching-diary', teachingDiaryRoutes);

export default app;
