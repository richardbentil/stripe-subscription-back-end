import { Router } from 'express';
const router = Router();
import authController from '../controllers/authController.js';

const { register, login } = authController;

router.post('/register', register);
router.post('/login', login);

export default router;
