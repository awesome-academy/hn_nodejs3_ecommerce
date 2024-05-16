import { checkIsAdmin, checkLoggedIn, checkValidId } from '../middlewares';
import { NextFunction, Request, Response } from 'express';
import * as categoryService from '../services/category.service';
import asyncHandler from 'express-async-handler';
import { validateCreateCategory } from '../middlewares/validate/category.validate';
import { getTranslatedMessage } from '../utils/i18n';
import { CATEGORY_WORKSHEET_COLUMNS, ErrorCode, Status } from '../constants';
import { t } from 'i18next';
import ExcelJS from 'exceljs';

export interface IAdminCategoryRequest extends Request {
  category?: any;
}

export const getCategories = [
  checkLoggedIn,
  checkIsAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const {categories, count} = await categoryService.adminGetCategories(req.query);

    const pages = Math.ceil(count / parseInt(req.query.limit as string));

    return res.render('admin/categoryManagement/index', {categories, pages, page: req.query.page, query: req.query});
  }),
];

const checkExistsCategoryByName = async (req: Request, res: Response, next: NextFunction) => {
  const category = await categoryService.getCategoryByName(req.body.name);

  if (category) {
    res.send({
      status: Status.FAIL,
      message: getTranslatedMessage('error.categoryExist', req.query.lng),
    });
    return;
  }

  next();
};

export const createCategory = [
  checkLoggedIn,
  checkIsAdmin,
  validateCreateCategory,
  checkExistsCategoryByName,
  asyncHandler(async (req: Request, res: Response) => {
    await categoryService.addCategory(req.body);

    res.send({
      status: Status.SUCCESS,
      message: getTranslatedMessage('category.createSuccess', req.query.lng),
    });
    return;
  }),
];

const checkExistsCategoryById = async (req: IAdminCategoryRequest, res: Response, next: NextFunction) => {
  const category = await categoryService.getCategoryById(parseInt(req.params.id));
  if (category === null) {
    return res.render('error', { code: ErrorCode.NOT_FOUND, title: t('error.notFound'), message: t('error.notFound', {id: req.params.id}) });
  }

  req.category = category;
  next();
};

export const updateCategory = [
  checkLoggedIn,
  checkIsAdmin,
  checkValidId,
  checkExistsCategoryById,
  validateCreateCategory,
  checkExistsCategoryByName,
  asyncHandler(async (req: IAdminCategoryRequest, res: Response) => {    
    await categoryService.updateCategory(req.category, req.body);

    res.send({
      status: Status.SUCCESS,
      message: getTranslatedMessage('category.updateSuccess', req.query.lng),
    });
    return;
  }),
];

export const exportData = [
  checkLoggedIn,
  checkIsAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const categories = await categoryService.getAllCategories();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Categories');

    worksheet.columns = CATEGORY_WORKSHEET_COLUMNS;

    categories.forEach(category => {
      worksheet.addRow(category);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=categories.xlsx');

    await workbook.xlsx.write(res);
    res.end();
    return;
  }),
];
