import express from 'express';
const router = express.Router();
import * as adminOrderController from '../../controllers/admin.order.controller';
import * as orderController from '../../controllers/order.controller';

router.get('/export', adminOrderController.exportData);
router.post('/:id/approve', adminOrderController.approveOrder);
router.post('/:id/complete', adminOrderController.completeOrder);
router.post('/:id/reject', adminOrderController.rejectOrder);
router.get('/:id', orderController.getOrder);
router.get('/', adminOrderController.getOrders);
export default router;
