import asyncHandler from 'express-async-handler';
import { checkIsAdmin, checkLoggedIn, checkValidId } from '../middlewares';
import * as productService from '../services/product.service';
import { NextFunction, Request, Response } from 'express';
import { EntityStatus, ErrorCode, PRODUCT_WORKSHEET_COLUMNS, Status } from '../constants';
import * as categoryService from '../services/category.service';
import { uploadImage } from '../middlewares/multer.middleware';
import { validateCreateProduct } from '../middlewares/validate/product.validate';
import { getTranslatedMessage } from '../utils/i18n';
import { t } from 'i18next';
import { Product } from '../entities/product.entity';
import { Transactional } from 'typeorm-transactional';
import * as orderService from '../services/order.service';
import ExcelJS from 'exceljs';

export interface IAdminProductRequest extends Request {
  product?: Product;
  files?: any[];
  errors?: any[];
}

export const getProducts = [
  checkLoggedIn,
  checkIsAdmin,
  asyncHandler(async(req: Request, res: Response) => {
    const { count, products } = await productService.getProducts(req.query);

    const pages = Math.ceil(count / parseInt(req.query.limit as string));

    const categories = await categoryService.getCategories();

    return res.render('admin/productManagement/index', {products, EntityStatus, categories, page: req.query.page, pages, query: req.query});
  }),
];

export const getCreateProduct = [
  checkLoggedIn,
  checkIsAdmin,
  asyncHandler(async(req: Request, res: Response) => {
    const categories = await categoryService.getCategories();
    return res.render('admin/productManagement/form', {categories, EntityStatus});
  }),
];

export const checkExistsProductByName = async(req: IAdminProductRequest, res: Response, next: NextFunction) => {
  const product = await productService.getProductByName(req.body.name);
  if (product) {
    req.errors = [{
      path: 'name',
      msg: getTranslatedMessage('error.nameExists', req.query.lng),
    }];
    const categories = await categoryService.getCategories(); 
    return res.render('admin/productManagement/form', {categories, EntityStatus, errors: req.errors});
  }

  next();
};

export const postCreateProduct = [
  checkLoggedIn,
  checkIsAdmin,
  uploadImage.array('images'),
  validateCreateProduct,
  checkExistsProductByName,
  asyncHandler(async (req: IAdminProductRequest, res: Response) => {
    if (req.files) {
      req.body.status = req.body.status === EntityStatus.ACTIVE ? true : false;
      req.body.category = await categoryService.getCategoryByName(req.body.category);
      const product = await productService.createProduct(req.body);
      await productService.createProductImages(product, req.files);
      return res.redirect('/admin/product');
    } else {
      const categories = await categoryService.getCategories(); 
      return res.render('admin/productManagement/form', {categories, EntityStatus, errors: [
        {
          path: 'images',
          msg: getTranslatedMessage('error.cantUploadImages', req.query.lng),
        },
      ]});
    }
  }),
];

const checkExistsProduct = async (req: IAdminProductRequest, res: Response, next: NextFunction) => {
  const product = await productService.getProductById(parseInt(req.params.id));
  if (product === null) {
    res.render('error', { code: ErrorCode.NOT_FOUND, title: t('error.notFound'), message: t('error.notFound', {id: req.params.id}) });
  }

  req.product = product;
  next();
};

export const getUpdateProduct = [
  checkLoggedIn,
  checkIsAdmin,
  checkValidId,
  checkExistsProduct,
  asyncHandler(async(req: IAdminProductRequest, res: Response) => {
    const categories = await categoryService.getCategories();
    return res.render('admin/productManagement/form', {categories, EntityStatus, product: req.product, isUpdate: true});
  }),
];

class ProcessUpdateProduct {
  @Transactional()
  static async processUpdateProduct(req: IAdminProductRequest) {
    const product = await productService.updateProduct(req.product, req.body);
    await productService.deleteProductImages(product);
    await productService.createProductImages(product, req.files);
  }
}

export const postUpdateProduct = [
  checkLoggedIn,
  checkIsAdmin,
  checkValidId,
  checkExistsProduct,
  uploadImage.array('images'),
  validateCreateProduct,
  checkExistsProductByName,
  asyncHandler(async(req: IAdminProductRequest, res: Response) => {
    if (req.files) {
      req.body.status = req.body.status === EntityStatus.ACTIVE ? true : false;
      req.body.category = await categoryService.getCategoryByName(req.body.category);
      await ProcessUpdateProduct.processUpdateProduct(req);
      return res.redirect('/admin/product');
    } else {
      const categories = await categoryService.getCategories(); 
      return res.render('admin/productManagement/form', {categories, EntityStatus, errors: [
        {
          path: 'images',
          msg: getTranslatedMessage('error.cantUploadImages', req.query.lng),
        },
      ]});
    }
  }),
];

export const inactiveProduct = [
  checkLoggedIn,
  checkIsAdmin,
  checkExistsProduct,
  async (req: IAdminProductRequest, res: Response) => {
    const orders = await orderService.getOrdersByProduct(req.product);

    if (orders) {
      return res.send({
        status: Status.FAIL,
        message: getTranslatedMessage('error.orderUnprocessed', req.query.lng),
      });
    } else {
      await productService.changeStatusProduct(req.product, false);
  
      return res.send({
        status: Status.SUCCESS,
        message: getTranslatedMessage('admin.product.inactiveProductSuccess', req.query.lng),
      });
    }
  },
];

export const activeProduct = [
  checkLoggedIn,
  checkIsAdmin,
  checkExistsProduct,
  async (req: IAdminProductRequest, res: Response) => {
    await productService.changeStatusProduct(req.product, true);

    return res.send({
      status: Status.SUCCESS,
      message: getTranslatedMessage('admin.product.activeProductSuccess', req.query.lng),
    });
  },
];

export const exportData = [
  checkLoggedIn,
  checkIsAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const products = await productService.getAllProducts();
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.columns = PRODUCT_WORKSHEET_COLUMNS;

    products.forEach(product => {
      worksheet.addRow({
        id: product.id,
        name: product.name,
        category: product.category ? product.category.name : 'N/A',
        price: product.price,
        description: product.description,
        quantity: product.quantity,
        ratingAvg: product.ratingAvg,
        quantitySold: product.quantitySold,
        isActive: product.isActive,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');

    await workbook.xlsx.write(res);
    res.end();
    return;
  }),
];
