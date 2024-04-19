import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Category } from './category.entity';
import { BaseEntity } from './base.entity';
import { ProductImage } from './productImage.entity';
import { Rating } from './rating.entity';
import { CartItem } from './cartItem.entity';
import { OrderItem } from './orderItem.entity';

@Entity()
export class Product extends BaseEntity {
  @Column({ nullable: false })
  name: string | undefined;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category | undefined;

  @Column({ nullable: false })
  price: number | undefined;

  @Column({ nullable: false })
  description: string | undefined;

  @Column({ nullable: false, type: 'float', name: 'rating_avg' })
  ratingAvg: number | undefined;

  @OneToMany(() => ProductImage, (productImage) => productImage.product)
  images: ProductImage[] | undefined;

  @OneToMany(() => Rating, (rating) => rating.product)
  ratings: Rating[] | undefined;

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems: CartItem[] | undefined;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[] | undefined;
}