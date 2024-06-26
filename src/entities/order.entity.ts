import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { User } from './user.entity';
import { Coupon } from './coupon.entity';
import { OrderStatus, PaymentMethod } from '../constants';
import { BaseEntity } from './base.entity';
import { OrderItem } from './orderItem.entity';

@Entity()
export class Order extends BaseEntity {
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User | undefined;

  @ManyToOne(() => Coupon, (coupon) => coupon.orders, { nullable: true })
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon | undefined;

  @Column({ type: 'float', nullable: false })
  total: number | undefined;

  @Column({ nullable: false })
  @Index({ fulltext: true })
  name: string | undefined;

  @Column({ nullable: false })
  phone: string | undefined;

  @Column({ nullable: false })
  email: string | undefined;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CASH_ON_DELIVERY, name: 'payment_method'})
  paymentMethod: string | undefined;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus | undefined;

  @Column({ nullable: false })
  @Index({ fulltext: true })
  address: string | undefined;

  @Column({ nullable: true, name: 'reason_reject' })
  reasonReject: string | undefined;

  @Column({ type: 'text', nullable: true })
  note: string | undefined;

  @Column({ nullable: true })
  proof: string | undefined;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items: OrderItem[] | undefined;
}
