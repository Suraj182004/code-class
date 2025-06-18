import { Router } from 'express';
import { signup, login } from './auth.controller';
import { getProfile, updateProfile, linkLeetCodeCredentials, updateJudge0Key, removeJudge0Key, getJudge0Status, updateGeminiKey, removeGeminiKey, getGeminiStatus } from './profile.controller';
import { protect } from './auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);

router.get('/me', protect, getProfile);
router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.post('/leetcode-credentials', protect, linkLeetCodeCredentials);

// Judge0 API key management
router.post('/judge0-key', protect, updateJudge0Key);
router.delete('/judge0-key', protect, removeJudge0Key);
router.get('/judge0-status', protect, getJudge0Status);

// Gemini API key management (Teachers only)
router.post('/gemini-key', protect, updateGeminiKey);
router.delete('/gemini-key', protect, removeGeminiKey);
router.get('/gemini-status', protect, getGeminiStatus);

export default router; 