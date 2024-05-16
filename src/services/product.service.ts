import { Brackets } from 'typeorm';
import { EntityStatus, Query } from '../constants';
import { AppDataSource } from '../database/dataSource';
import { Product } from '../entities/product.entity';
import { ProductImage } from '../entities/productImage.entity';

const productRepository = AppDataSource.getRepository(Product);
const productImageRepository = AppDataSource.getRepository(ProductImage);

export const getProducts = async (data: any) => {
  const page = data.page || Query.PAGE_DEFAULT;
  const limit = data.limit || Query.LIMIT_DEFAULT;

  const query = productRepository.createQueryBuilder('product');

  if (data.keyword) {
    query.andWhere(new Brackets(qb => {
      qb.where('MATCH(product.name) AGAINST (:keyword IN BOOLEAN MODE)', { keyword: data.keyword })
        .orWhere('MATCH(product.description) AGAINST (:keyword IN BOOLEAN MODE)', { keyword: data.keyword });
    }));
  }

  if (data.minPrice) {
    query.andWhere('(product.price >= :minPrice AND product.price <= :maxPrice)', {
      minPrice: data.minPrice || 0,
    });
  }

  if (data.maxPrice) {
    query.andWhere('(product.price <= :maxPrice)', {
      maxPrice: data.maxPrice || Number.MAX_VALUE,
    });
  }

  if (data.category) {
    query.andWhere('product.category_id = :categoryId', { categoryId: data.category });
  }

  if (data.categories) {
    const categories = data.categories.split(',');
    query.andWhere('product.category_id IN (:...categories)', { categories });
  }

  if (data.ratingAvgs) {
    const ratingAvgs = data.ratingAvgs.split(',').map(Number);
    query.andWhere('product.rating_avg IN (:...ratingAvgs)', { ratingAvgs });
  }

  if (data.statuses) {
    const statuses = data.statuses.split(',').map(status => {
      return status === EntityStatus.ACTIVE;
    });
    query.andWhere('product.is_active IN (:...statuses)', { statuses });
  }

  if (data.isActive === EntityStatus.ACTIVE) {
    query.andWhere('product.isActive = :isActive', {
      isActive: data.isActive === EntityStatus.ACTIVE || false,
    });
  }

  query.leftJoinAndSelect('product.category', 'category')
       .leftJoinAndSelect('product.images', 'product_image');

  const count = await query.getCount();

  const products = await query
    .orderBy('product.created_at', 'DESC')
    .limit(limit)
    .offset((page - 1) * limit)
    .getMany();

  return { count, products };
};

export const getProductById = async (id: number) => {
  return await productRepository.findOne({
    where: {
      id: id,
    },
    relations: ['category', 'images', 'ratings'],
  });
};

export const getFeaturedProduct = async () => {
  return await productRepository.find({
    order: {
      quantitySold: 'DESC',
    },
    relations: ['images'],
    take: Query.LIMIT_DEFAULT,
    skip: 0,
  });
};

export const getProductByName = async (name: string) => {
  return await productRepository.findOne({
    where: {
      name: name,
    },
  });
};

export const createProduct = async (data: any) => {
  const product = productRepository.create({
    name: data.name,
    category: data.category,
    price: data.price,
    description: data.description,
    quantity: data.quantity,
    isActive: data.status,
  });

  return await productRepository.save(product);
};

export const createProductImages = async (product: Product, files: any) => {
  const productImagesPromises = files.map(async (file: { location: any; }) => {
    const productImage = productImageRepository.create({
      product: product,
      url: file.location,
    });
    return await productImageRepository.save(productImage);
  });

  return await Promise.all(productImagesPromises);
};

export const updateProduct = async (product: Product, data: any) => {
  product.name = data.name;
  product.category = data.category;
  product.price = data.price;
  product.description = data.description;
  product.quantity = data.quantity;
  product.isActive = data.status;

  return await productRepository.save(product);
};

export const deleteProductImages = async (product: Product) => {
  return await productImageRepository.delete({
    product: product,
  });
};

export const changeStatusProduct = async (product: Product, status: boolean) => {
  product.isActive = status;

  return await productRepository.save(product);
};

export const getAllProducts = async () => {
  return await productRepository.find({
    relations: ['category'],
    order: {
      createdAt: 'DESC',
    },
  });
};
