// app.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import cookieParser from 'cookie-parser';

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

app.use('/api/teachers', require('./routes/teacher.routes'));


export default app;
