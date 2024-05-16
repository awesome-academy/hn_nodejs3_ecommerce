import express from 'express';
const router = express.Router();
import * as adminUserControllers from '../../controllers/admin.user.controller';

router.get('/export', adminUserControllers.exportData);
router.get('/create', adminUserControllers.getCreateUser);
router.post('/create', adminUserControllers.postCreateUser);
router.get('/:id', adminUserControllers.getUpdateUser);
router.post('/:id/inactive', adminUserControllers.inactiveUser);
router.post('/:id/active', adminUserControllers.activeUser);
router.post('/:id', adminUserControllers.postUpdateUser);
router.get('/', adminUserControllers.getUsers);
export default router;
