import express from 'express';
const router = express.Router();
import * as cartController from '../controllers/cart.controller';

router.post('/add', cartController.postAddItemToCart);
router.get('/', cartController.getCart);

export default router;
