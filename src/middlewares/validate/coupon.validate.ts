import { NextFunction, Request, Response } from 'express';
import { CreateCouponDTO } from '../../dto/coupon/createCoupon.dto';
import { validate } from 'class-validator';
import { getTranslatedMessage } from '../../utils/i18n';
import { Status } from '../../constants';

export const validateCreateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  const createCouponDto = new CreateCouponDTO(req.body);

  const errors = await validate(createCouponDto);

  if (errors.length > 0) {
    const errorMessages = errors.map(error => ({
      path: error.property,
      msg: getTranslatedMessage(Object.values(error.constraints)[0], req.query.lng),
    }));
    res.send({
      status: Status.FAIL,
      errors: errorMessages,
    });
    return;
  }

  next();
};
