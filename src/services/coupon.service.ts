import { LessThanOrEqual, MoreThan } from 'typeorm';
import { AppDataSource } from '../database/dataSource';
import { Coupon } from '../entities/coupon.entity';
import dayjs from 'dayjs';

const couponRepository = AppDataSource.getRepository(Coupon);

export const findCouponByName = async (name: string) => {
  return await couponRepository.findOne({
    where: {
      name,
      startDate: LessThanOrEqual(new Date()),
      endDate: MoreThan(new Date()),
    },
  });
};

export const getCoupons = async (data: any) => {
  const query = couponRepository.createQueryBuilder('coupon');

  if (data.keyword) {
    query.where('MATCH(coupon.name) AGAINST (:keyword IN BOOLEAN MODE)', { keyword: data.keyword });
  }

  if (data.percentage) {
    query.andWhere('coupon.percentage = :percentage', {
      percentage: data.percentage,
    });
  }

  if (data.startDate) {
    query.andWhere('coupon.startDate >= :startDate', {
      startDate: dayjs(data.startDate).startOf('day').toDate(),
    });
  }

  if (data.endDate) {
    query.andWhere('coupon.endDate <= :endDate', {
      endDate: dayjs(data.endDate).endOf('day').toDate(),
    });
  }

  const count = await query.getCount();

  const coupons = await query
    .orderBy('coupon.created_at', 'DESC')
    .limit(data.limit)
    .offset((data.page - 1) * data.limit)
    .getMany();


  return {coupons, count};
};

export const getCouponByName = async (name: string) => {
  return await couponRepository.findOne({
    where: {
      name,
    },
  });
};

export const createCoupon = async (data: any) => {
  const coupon = couponRepository.create({
    name: data.name,
    percentage: data.percentage,
    startDate: data.startDate,
    endDate: data.endDate,
  });

  return await couponRepository.save(coupon);
};

export const getCouponById = async (id: number) => {
  return await couponRepository.findOne({
    where: {
      id,
    },
  });
};

export const updateCoupon = async (coupon: Coupon, data: any) => {
  coupon.name = data.name;
  coupon.percentage = data.percentage;
  coupon.startDate = data.startDate;
  coupon.endDate = data.endDate;

  return await couponRepository.save(coupon);
};

export const getAllCoupons = async () => {
  return await couponRepository.find({
    order: {
      createdAt: 'DESC',
    },
  });
};
