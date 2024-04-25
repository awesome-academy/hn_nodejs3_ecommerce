import { AppDataSource } from '../database/dataSource';
import { Product } from '../entities/product.entity';
import * as productService from '../services/product.service';

let connection;

beforeAll(async () => {
  connection = await AppDataSource.initialize();
});

afterAll(async () => {
  await connection.destroy();
});

describe('getProducts', () => {
  it('should filter products by keyword, minPrice, maxPrice, and category', async () => {
    const query = {
      keyword: 'Cynictis canadensis',
      minPrice: 10,
      maxPrice: 100,
      category: 1,
    };
    
    const result = await productService.getProducts(query);

    const words = query.keyword.toLocaleLowerCase().split(' ');
    
    expect(typeof result.count).toBe('number');
    result.products.forEach(product => {
      expect(product.price).toBeGreaterThanOrEqual(query.minPrice);
      expect(product.price).toBeLessThanOrEqual(query.maxPrice);

      expect(product.category.id).toBe(query.category);

      const nameContainsKeyword = words.some(word => product.name.toLocaleLowerCase().includes(word));
      const descriptionContainsKeyword = words.some(word => product.description.toLocaleLowerCase().includes(word));
      expect(nameContainsKeyword || descriptionContainsKeyword).toBe(true);
    });
  });
});

describe('getProductById', () => {
  it('should return product with given id', async () => {
    const id = 1; 
    const product = await productService.getProductById(id);
    expect(product.id).toEqual(id);
  });

  it('should return null if no product found with given id', async () => {
    const id = -1;
    const product = await productService.getProductById(id);
    expect(product).toBeNull();
  });
});

describe('getFeaturedProduct', () => {
  it('should return an array of featured products', async () => {
    const featuredProducts = await productService.getFeaturedProduct();
    featuredProducts.forEach(product => {
      expect(product).toBeInstanceOf(Product);
    });
  });
});
