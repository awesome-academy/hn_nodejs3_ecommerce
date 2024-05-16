import asyncHandler from 'express-async-handler';
import { checkIsAdmin, checkLoggedIn } from '../middlewares';
import { NextFunction, Request, Response } from 'express';
import * as userService from '../services/user.service';
import { ErrorCode, Gender, Role, Status, EntityStatus, USER_WORKSHEET_COLUMNS } from '../constants';
import { uploadImage } from '../middlewares/multer.middleware';
import { validateCreateUser, validateUpdateUser } from '../middlewares/validate/user.validate';
import { getTranslatedMessage } from '../utils/i18n';
import * as cartService from '../services/cart.service';
import { t } from 'i18next';
import ExcelJS from 'exceljs';

export interface IAdminUserRequest extends Request {
  user?: any;
  file?: any;
}

export const getUsers = [
  checkLoggedIn,
  checkIsAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const {users, count} = await userService.getUsers(req.query);

    const pages = Math.ceil(count / parseInt(req.query.limit as string));

    return res.render('admin/userManagement/index', {users, Gender, EntityStatus, pages, page: req.query.page, query: req.query});
  }),
];

export const getCreateUser = [
  checkLoggedIn,
  checkIsAdmin,
  (req: Request, res: Response) => {
    return res.render('admin/userManagement/form', {genders: Object.keys(Gender), EntityStatus, roles: Object.keys(Role), isUpdate: false});
  },
];

export const postCreateUser = [
  checkLoggedIn,
  checkIsAdmin,
  uploadImage.single('avatar'),
  validateCreateUser,
  asyncHandler(async (req: IAdminUserRequest, res: Response) => {
    const existsUser = await userService.getUserByEmail(req.body.email);

    if (existsUser) {
      return res.render('admin/userManagement/form', {
        errors: [{
          path: 'email',
          msg: getTranslatedMessage('error.emailAlreadyExists', req.query.lng),
        }],
        genders: Object.keys(Gender), EntityStatus, roles: Object.keys(Role), isUpdate: false,
      });
    }

    if (req.file) {
      req.body.avatar = req.file.location;
      req.body.isActive = req.body.isActive === EntityStatus.ACTIVE ? true : false;
      const user = await userService.adminCreateAccount(req.body);

      await cartService.createCart(user);
      return res.redirect('/admin/user');
    } else {
      res.render('admin/userManagement/form', {
        avatarError: getTranslatedMessage('error.cantUploadAvatar', req.query.lng),
        genders: Object.keys(Gender), EntityStatus, roles: Object.keys(Role), isUpdate: false,
      });
    }
  }),
];

const checkExistsUser = async (req: IAdminUserRequest, res: Response, next: NextFunction) => {
  const user = await userService.getUserById(parseInt(req.params.id));
  if (user === null) {
    res.render('error', { code: ErrorCode.NOT_FOUND, title: t('error.notFound'), message: t('error.notFound', {id: req.params.id}) });
  }

  req.user = user;
  next();
};

export const getUpdateUser = [
  checkLoggedIn,
  checkIsAdmin,
  checkExistsUser,
  (req: IAdminUserRequest, res: Response) => {
    return res.render('admin/userManagement/form', {genders: Object.keys(Gender), EntityStatus, roles: Object.keys(Role), isUpdate: true, user: req.user});
  },
];

export const postUpdateUser = [
  checkLoggedIn,
  checkIsAdmin,
  checkExistsUser,
  validateUpdateUser,
  async (req: IAdminUserRequest, res: Response) => {
    await userService.adminUpdateUser(req.user, req.body);
    return res.redirect('/admin/user');
  },
];

export const inactiveUser = [
  checkLoggedIn,
  checkIsAdmin,
  checkExistsUser,
  async (req: IAdminUserRequest, res: Response) => {
    await userService.changeStatusUser(req.user, false);

    return res.send({
      status: Status.SUCCESS,
      message: getTranslatedMessage('admin.user.inactiveUserSuccess', req.query.lng),
    });
  },
];

export const activeUser = [
  checkLoggedIn,
  checkIsAdmin,
  checkExistsUser,
  async (req: IAdminUserRequest, res: Response) => {
    await userService.changeStatusUser(req.user, true);

    return res.send({
      status: Status.SUCCESS,
      message: getTranslatedMessage('admin.user.activeUserSuccess', req.query.lng),
    });
  },
];

export const exportData = [
  checkLoggedIn,
  checkIsAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const users = await userService.getAllUsers();
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    worksheet.columns = USER_WORKSHEET_COLUMNS;
    
    users.forEach(user => {
      worksheet.addRow(user);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');

    await workbook.xlsx.write(res);
    res.end();
    return;
  }),
];
