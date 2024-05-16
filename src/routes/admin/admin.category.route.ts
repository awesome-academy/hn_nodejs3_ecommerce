import express from 'express';
const router = express.Router();
import * as adminCategoryController from '../../controllers/admin.category.controller';

router.get('/export', adminCategoryController.exportData);
router.post('/create', adminCategoryController.createCategory);
router.post('/:id/update', adminCategoryController.updateCategory);
router.get('/', adminCategoryController.getCategories);
export default router;
