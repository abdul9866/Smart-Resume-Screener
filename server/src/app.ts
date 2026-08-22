import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jobRoutes from './routes/jobRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with support for local development setup (Vite on port 3000)
app.use(
  cors({
    origin: '*', // Allow all origins for simplicity in this prototype
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (excluding sensitive info like resume texts)
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// API routes
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Centralized error handling middleware
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Smart Resume Screener Backend running...`);
    console.log(`Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=========================================`);
  });
}

export default app;
