import express from 'express';
const router = express.Router();
import * as adminCouponController from '../../controllers/admin.coupon.controller';

router.get('/export', adminCouponController.exportData);
router.post('/create', adminCouponController.postCreateCoupon);
router.post('/:id/update', adminCouponController.postUpdateCoupon);
router.get('/', adminCouponController.getCoupons);
export default router;
