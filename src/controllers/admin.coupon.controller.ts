import asyncHandler from 'express-async-handler';
import { checkIsAdmin, checkLoggedIn, checkValidId } from '../middlewares';
import * as couponService from '../services/coupon.service';
import * as orderService from '../services/order.service';
import { NextFunction, Request, Response } from 'express';
import { getTranslatedMessage } from '../utils/i18n';
import { ErrorCode, Status } from '../constants';
import { validateCreateCoupon } from '../middlewares/validate/coupon.validate';
import { t } from 'i18next';

interface IAdminCouponRequest extends Request {
  coupon?: any;
  errors?: any[];
}

export const getCoupons = [
  checkLoggedIn,
  checkIsAdmin,
  asyncHandler(async(req: Request, res: Response) => {
    const {coupons, count} = await couponService.getCoupons(req.query);

    const pages = Math.ceil(count / parseInt(req.query.limit as string));

    return res.render('admin/couponManagement/index', {coupons, pages, page: req.query.page, query: req.query});
  }),
];

const checkExistsCouponByName = async(req: IAdminCouponRequest, res: Response, next: NextFunction) => {
  if(req.coupon.name === req.body.name) {
    next();
    return;
  }
  
  const coupon = await couponService.getCouponByName(req.body.name);

  if (coupon) {
    res.send({
      status: Status.FAIL,
      errors: [
        {
          path: 'name',
          msg: getTranslatedMessage('error.nameExists', req.query.lng),
        },
      ],
    });
    return;
  }

  next();
};

export const postCreateCoupon = [
  checkLoggedIn,
  checkIsAdmin,
  validateCreateCoupon,
  checkExistsCouponByName,
  asyncHandler(async(req: IAdminCouponRequest, res: Response) => {
    await couponService.createCoupon(req.body);

    res.send({
      status: Status.SUCCESS,
      message: getTranslatedMessage('admin.coupon.createSuccess', req.query.lng),
    });

    return;
  }),
];

const checkExistsCouponById = async (req: IAdminCouponRequest, res: Response, next: NextFunction) => {
  const coupon = await couponService.getCouponById(parseInt(req.params.id));
  if (coupon === null) {
    res.render('error', { code: ErrorCode.NOT_FOUND, title: t('error.notFound'), message: t('error.notFound', {id: req.params.id}) });
  }

  req.coupon = coupon;
  next();
};

export const postUpdateCoupon = [
  checkLoggedIn,
  checkIsAdmin,
  checkValidId,
  checkExistsCouponById,
  validateCreateCoupon,
  checkExistsCouponByName,
  asyncHandler(async(req: IAdminCouponRequest, res: Response) => {
    const orders = await orderService.getOrdersByCoupon(req.coupon);

    if (orders) {
      res.send({
        status: Status.FAIL,
        message: getTranslatedMessage('error.orderContainCouponUnprocessed', req.query.lng),
      });
      return;
    } else {
      await couponService.updateCoupon(req.coupon, req.body);
  
      res.send({
        status: Status.SUCCESS,
        message: getTranslatedMessage('admin.coupon.updateSuccess', req.query.lng),
      });
  
      return;
    }
    
  }),
];
