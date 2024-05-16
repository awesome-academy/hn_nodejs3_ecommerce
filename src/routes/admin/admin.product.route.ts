import express from 'express';
const router = express.Router();
import * as adminProductController from '../../controllers/admin.product.controller';

router.get('/export', adminProductController.exportData);
router.get('/create', adminProductController.getCreateProduct);
router.post('/create', adminProductController.postCreateProduct);
router.post('/:id/inactive', adminProductController.inactiveProduct);
router.post('/:id/active', adminProductController.activeProduct);
router.get('/:id', adminProductController.getUpdateProduct);
router.post('/:id', adminProductController.postUpdateProduct);
router.get('/', adminProductController.getProducts);
export default router;
