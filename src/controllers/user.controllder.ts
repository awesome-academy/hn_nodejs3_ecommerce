import { NextFunction, Request, Response } from 'express';
import { Gender } from '../constants';
import { uploadImage } from '../middlewares/multer.middleware';
import { User } from '../entities/user.entity';
import * as userService from '../services/user.service';
import * as cartService from '../services/cart.service';
import { t } from 'i18next';
import { sendEmail } from '../utils/mail';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import { getTranslatedMessage } from '../utils/i18n';
import { validateForgotPassword, validateRegisterUser, validateResetPassword } from '../middlewares/validate/user.validate';

interface IUserRequest extends Request {
  user?: User;
  file?: any;
}

export const getRegister = (req: Request, res: Response) => {
  return res.render('register/index', {genders: Object.keys(Gender)});
};

export const postRegister = [
  uploadImage.single('avatar'),
  validateRegisterUser,
  asyncHandler(async (req: IUserRequest, res: Response) => {
    const existsUser = await userService.getUserByEmail(req.body.email);

    if (existsUser && existsUser.isActive === true) {
      return res.render('register', {
        errors: [{
          path: 'email',
          msg: getTranslatedMessage('error.emailAlreadyExists', req.query.lng),
        }],
        genders: Object.keys(Gender),
      });
    }
    
    if (req.file) {
      req.body.avatar = req.file.location;
      const {user, tokenActive} = await userService.createAccount(req.body);
      const activeURL = `${req.protocol}://${req.get(
        'host',
      )}/user/active/${tokenActive}`;

      const emailData = {
        subject: t('email.active.subject'),
        email: user.email,
        content: {
          activeURL,
          welcome: getTranslatedMessage('email.active.welcome', req.query.lng),
          text: getTranslatedMessage('email.active.text', req.query.lng),
          autoGenerate: getTranslatedMessage('email.active.autoGenerate', req.query.lng),
          cheers: getTranslatedMessage('email.active.cheers', req.query.lng),
          fruitablesTeam: getTranslatedMessage('email.active.fruitablesTeam', req.query.lng),
          confirmAccount: getTranslatedMessage('email.active.confirmAccount', req.query.lng),
        },
      };

      await sendEmail(emailData, 'activeAccount');

      await cartService.createCart(user);
      return res.render('emailConfirm/index', {email: user.email});
    } else {
      res.render('register', {
        avatarError: getTranslatedMessage('error.cantUploadAvatar', req.query.lng),
        genders: Object.keys(Gender),
      });
    }
  }),
];

export const getActive = [
  asyncHandler(async (req: IUserRequest, res: Response) => {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.tokenActive)
      .digest('hex');

    const user = await userService.checkValidTokenActive(hashedToken);

    if (!user) {
      return res.render('failConfirm/index');
    }

    await userService.activeUser(user);

    return res.render('successConfirm/index');
  }),
];

export const getForgotPassword = [
  (req: Request, res: Response) => {
    return res.render('forgotPassword/index');
  },
];

export const postForgotPassword = [
  validateForgotPassword,
  asyncHandler(async (req: Request, res: Response) => {
    const existsUser = await userService.getUserByEmail(req.body.email);

    if (existsUser && existsUser.isActive === true) {
      const tokenResetPassword = await userService.forgotPassword(existsUser);
      const resetPasswordUrl = `${req.protocol}://${req.get(
        'host',
      )}/user/reset-password/${tokenResetPassword}`;

      const emailData = {
        subject: t('email.forgotPassword.subject'),
        email: existsUser.email,
        content: {
          resetPasswordUrl,
          text: getTranslatedMessage(t('email.forgotPassword.text'), req.query.lng),
          link: getTranslatedMessage(t('email.forgotPassword.link'), req.query.lng),
        },
      };

      await sendEmail(emailData, 'forgotPassword');

      return res.render('emailResetPassword/index', {email: existsUser.email});
    } else {
      return res.render('forgotPassword', {
        errors: [{
          path: 'email',
          msg: getTranslatedMessage('error.emailNotExists', req.query.lng),
        }],
      });
    }
  }), 
];

const checkValidTokenResetPassword = async (req: IUserRequest, res: Response, next: NextFunction) => {
  const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.tokenResetPassword)
      .digest('hex');

  req.user = await userService.checkValidTokenResetPassword(hashedToken);

  next();
};

export const getResetPassword = [
  checkValidTokenResetPassword,
  (req: IUserRequest, res: Response) => {
    if (!req.user) {
      res.render('failConfirm/index');
      return;
    }
    res.render('resetPassword/index');
    return;
  },
];

export const postResetPassword = [
  validateResetPassword,
  checkValidTokenResetPassword,
  asyncHandler(async (req: IUserRequest, res: Response) => {
    if (!req.user) {
      res.render('failConfirm/index');
      return;
    }

    await userService.resetPassword(req.user, req.body.password);

    res.render('successResetPassword/index'); 
    return;
  }),
];
