import { Brackets, In } from 'typeorm';
import { OrderStatus, Role } from '../constants';
import { AppDataSource } from '../database/dataSource';
import { CartItem } from '../entities/cartItem.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/orderItem.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { Coupon } from '../entities/coupon.entity';
import { t } from 'i18next';
import { getTranslatedMessage } from '../utils/i18n';
import config from '../config';
import { sendMailDataToQueue } from '../utils/mail';
import dayjs from 'dayjs';

const orderRepository = AppDataSource.getRepository(Order);
const orderItemRepository = AppDataSource.getRepository(OrderItem);
const productRepository = AppDataSource.getRepository(Product);

export const createOrder = async (data: any) => {
  const order = orderRepository.create({
    user: data.user,
    coupon: data.coupon,
    total: data.total,
    name: data.name,
    phone: data.phone,
    email: data.email,
    paymentMethod: data.paymentMethod,
    address: data.address,
    note: data.note,
    proof: data.proof,
  });

  return await orderRepository.save(order);
}; 

export const createOrderItems = async (items: CartItem[], order: Order) => {
  const orderItemsPromises = items.map(async item => {
    const orderItem = orderItemRepository.create({
      quantity: item.quantity,
      product: item.product,
      price: item.product.price,
      order: order,
    });
    return await orderItemRepository.save(orderItem);
  });

  return await Promise.all(orderItemsPromises);
};

export const getOrders = async (user: User, data: any) => {
  const query = orderRepository.createQueryBuilder('order');

  if (data.keyword) {
    query.andWhere(new Brackets(qb => {
      qb.where('MATCH(order.name) AGAINST (:keyword IN BOOLEAN MODE)', { keyword: data.keyword })
        .orWhere('MATCH(order.address) AGAINST (:keyword IN BOOLEAN MODE)', { keyword: data.keyword });
    }));
  }

  if (data.totalMin) {
    query.andWhere('(order.total >= :totalMin)', {
      totalMin: data.totalMin,
    });
  }

  if (data.totalMax) {
    query.andWhere('(order.total <= :totalMax)', {
      totalMax: data.totalMax,
    });
  }

  if (data.startDate) {
    query.andWhere('(order.created_at >= :startDate)', {
      startDate: dayjs(data.startDate).startOf('day').toDate(),
    });
  }

  if (data.endDate) {
    query.andWhere('(order.created_at <= :endDate)', {
      endDate: dayjs(data.endDate).endOf('day').toDate(),
    });
  }

  if (data.status) {
    const statuses = data.status.split(',');
    query.andWhere('order.status IN (:...statuses)', { statuses });
  }

  if (data.paymentMethod) {
    const paymentMethods = data.paymentMethod.split(',');
    query.andWhere('order.payment_method IN (:...paymentMethods)', { paymentMethods });
  }

  if (user.role !== Role.ADMIN) {
    query.andWhere('order.user_id = :userId', {
      userId: user.id,
    });
  }

  const count = await query.getCount();

  const orders = await query
    .orderBy('order.created_at', 'DESC')
    .limit(data.limit)
    .offset((data.page - 1) * data.limit)
    .getMany();

  return {orders, count};
};

export const getOrderById = async (id: number) => {
  return await orderRepository.findOne({
    where: {
      id: id,
    },
    relations: ['coupon', 'user'],
  });
};

export const getOrderItems = async (order: Order) => {
  return await orderItemRepository.find({
    where: {
      order: {
        id: order.id,
      },
    },
    relations: ['product', 'product.images'],
    order: {
      createdAt: 'DESC',
    },
  });
};

export const getOrderItemById = async (id: number) => {
  return await orderItemRepository.findOne({
    where: {
      id,
    },
    relations: ['product'],
  });
};

export const changeStatusOrder = async (order: Order, status: OrderStatus) => {
  order.status = status;
  return await orderRepository.save(order);
};

export const approveOrder = async (order: Order) => {
  const items = await orderItemRepository.find({
    where: {
      order: {
        id: order.id,
      },
    },
    relations: ['product'],
  });

  const updateProductQuantityPromises = items.map(async item => {
    if (item.product.quantity < item.quantity) throw new Error(`${item.product.name} is not enough quantity`);

    item.product.quantity -= item.quantity;
    item.product.quantitySold += item.quantity;
    await productRepository.save(item.product);
  });

  await Promise.all(updateProductQuantityPromises);

  return await changeStatusOrder(order, OrderStatus.APPROVED);
};

export const getOrdersByProduct = (product: Product) => {
  return orderRepository.findBy({
    items: {
      product: {
        id: product.id,
      },
    },
    status: In([OrderStatus.PENDING, OrderStatus.APPROVED]),
  });
};

export const getOrdersByCoupon = (coupon: Coupon) => {
  return orderRepository.findBy({
    coupon: coupon,
    status: In([OrderStatus.PENDING, OrderStatus.APPROVED]),
  });
};

export const getCountAndTotalRevenue = async (month?: number) => {
  const query = orderRepository.createQueryBuilder('order');

  let count = 0;
  let orders = [];
  let total = 0;

  query.where('order.status IN (:status)', { status: [OrderStatus.APPROVED, OrderStatus.COMPLETED] });

  if (month) {
    const currentDate = new Date();
    const year = currentDate.getFullYear(); 
  
    query.andWhere('MONTH(order.createdAt) = :month', { month });
    query.andWhere('YEAR(order.createdAt) = :year', { year });
  
    orders = await query.getMany();

    count = orders.length;
  } else {
    orders = await query.getMany();

    count = orders.length;
  }

  orders.forEach((order) => {
    total += order.total;
  });

  return {count, total};
};

export const getCountAndTotalRevenueEachMonth = async () => {
  const currentDate = new Date();
  
  const month = currentDate.getMonth() + 1;
  
  const promises = Array.from({ length: month }, (_, i) => {
    const monthNumber = i + 1;
    return getCountAndTotalRevenue(monthNumber)
      .then(data => ({ month: monthNumber, data }));
  });

  return Promise.all(promises);
};

export const sendEmailDataStatistic = async () => {
  const totalOrder = {
    total: 0,
    count: 0,
  };

  const orderData = await getCountAndTotalRevenueEachMonth();

  orderData.forEach(order => {
    totalOrder.total += order.data.total;
    totalOrder.count += order.data.count;
  });

  const emailData = {
    template: 'statistics',
    subject: t('email.statistic.subject'),
    email: config.emailAdmin,
    orderData,
    totalOrder,
    content: {
      title: getTranslatedMessage('email.statistic.title', 'en'),
      message: getTranslatedMessage('email.statistic.message', 'en'),
      totalStatistic: getTranslatedMessage('email.statistic.totalStatistic', 'en'),
      orders: getTranslatedMessage('email.statistic.orders', 'en'),
      total: getTranslatedMessage('email.statistic.total', 'en'),
      yearStatistic: getTranslatedMessage('email.statistic.yearStatistic', 'en'),
      month: getTranslatedMessage('email.statistic.month', 'en'),
    },
  };
  
  await sendMailDataToQueue(emailData);
};

export const getAllOrders = async () => {
  return await orderRepository.find({
    relations: ['coupon', 'user'],
    order: {
      createdAt: 'DESC',
    },
  });
};
