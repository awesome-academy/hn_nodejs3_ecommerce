import express from 'express';
const router = express.Router();
import * as userController from '../controllers/user.controllder';

router.get('/register', userController.getRegister);
router.get('/forgot-password', userController.getForgotPassword);
router.post('/forgot-password', userController.postForgotPassword);
router.get('/reset-password/:tokenResetPassword', userController.getResetPassword);
router.post('/reset-password/:tokenResetPassword', userController.postResetPassword);
router.post('/register', userController.postRegister);
router.get('/active/:tokenActive', userController.getActive);

export default router;
