import { Router } from 'express';
import { JobController } from '../controllers/jobController.js';
import { CandidateController } from '../controllers/candidateController.js';
import { upload } from '../middleware/fileUpload.js';

const router = Router();

// Job description management routes
router.post('/', JobController.createJob);
router.get('/', JobController.getJobs);
router.get('/:id', JobController.getJobById);
router.get('/:id/results', JobController.getJobResults);
router.get('/:id/export', JobController.exportJobResults);

// Execute candidate screening route for a specific job
router.post('/:id/screen', upload.array('resumes', 10), CandidateController.screenCandidates);

export default router;
