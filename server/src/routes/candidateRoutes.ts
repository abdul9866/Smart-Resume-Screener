import { Router } from 'express';
import { CandidateController } from '../controllers/candidateController.js';

const router = Router();

// Candidate profile management routes
router.get('/', CandidateController.getCandidates);
router.get('/:id', CandidateController.getCandidateById);
router.delete('/:id', CandidateController.deleteCandidate);

export default router;
