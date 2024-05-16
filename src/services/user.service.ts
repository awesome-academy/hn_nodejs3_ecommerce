import { Brackets, MoreThan } from 'typeorm';
import { AppDataSource } from '../database/dataSource';
import { User } from '../entities/user.entity';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import config from '../config';
import { EntityStatus, Role } from '../constants';

const userRepository = AppDataSource.getRepository(User);

const generateTokenActive = () => {
  const tokenActive = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(tokenActive).digest('hex');
  return {tokenActive, hashedToken};
};

export const createAccount = async (data: any) => {
  const {tokenActive, hashedToken} = generateTokenActive();

  const user = userRepository.create({
    name: data.name,
    email: data.email,
    password: bcrypt.hashSync(data.password, 10),
    gender: data.gender,
    phone: data.phone,
    dateOfBirth: data.dateOfBirth,
    avatar: data.avatar,
    address: data.address,
    tokenActive: hashedToken,
    tokenActiveExpires: new Date(Date.now() + config.tokenExpirationTime * 60 * 1000),
  });
  
  const newUser = await userRepository.save(user);

  return {
    user: newUser, 
    tokenActive,
  };
};

export const getUserByEmail = async (email: string) => {
  return await userRepository.findOne({
    where: {
      email,
    },
    relations: ['cart'],
  });
};

export const checkValidTokenActive = async (token: string) => {
  const now = new Date();
  return await userRepository.findOne({
    where: {
      tokenActive: token,
      tokenActiveExpires: MoreThan(now),
    },
  });
};

export const activeUser = async (user: User) => {
  user.isActive = true;
  user.tokenActive = null;
  user.tokenActiveExpires = null;

  await userRepository.save(user);
};

export const getUsers = async (data: any) => {
  const query = userRepository.createQueryBuilder('user');

  if (data.keyword) {
    query.andWhere(new Brackets(qb => {
      qb.where('MATCH(user.name) AGAINST (:keyword IN BOOLEAN MODE)', { keyword: data.keyword })
        .orWhere('MATCH(user.address) AGAINST (:keyword IN BOOLEAN MODE)', { keyword: data.keyword });
    }));
  }

  if (data.genders) {
    const genders = data.genders.split(',');
    query.andWhere('user.gender IN (:...genders)', { genders });
  }

  if (data.statuses) {
    const statuses = data.statuses.split(',').map(status => {
      return status === EntityStatus.ACTIVE;
    });
    query.andWhere('user.is_active IN (:...statuses)', { statuses });
  }

  const count = await query.getCount();

  const users = await query
    .orderBy('user.created_at', 'DESC')
    .limit(data.limit)
    .offset((data.page - 1) * data.limit)
    .getMany();


  return {users, count};
};

export const adminCreateAccount = async (data: any) => {
  const user = userRepository.create({
    name: data.name,
    email: data.email,
    password: bcrypt.hashSync(data.password, 10),
    gender: data.gender,
    phone: data.phone,
    dateOfBirth: data.dateOfBirth,
    avatar: data.avatar,
    address: data.address,
    role: data.role,
    isActive: data.isActive,
  });
  
  return await userRepository.save(user);
};

export const getUserById = async (id: number) => {
  return await userRepository.findOne({
    where: {
      id: id,
    },
  });
};

export const adminUpdateUser = async (user: User, data: any) => {
  user.isActive = data.isActive;
  user.role = data.role;

  return await userRepository.save(user);
};

export const changeStatusUser = async (user: User, status: boolean) => {
  user.isActive = status;

  return await userRepository.save(user);
};

export const forgotPassword = async (user: User) => {
  const {tokenActive, hashedToken} = generateTokenActive();

  user.tokenResetPassword =  hashedToken;
  user.tokenResetPasswordExpires = new Date(Date.now() + config.tokenExpirationTime * 60 * 1000);

  await userRepository.save(user);

  return tokenActive;
};

export const checkValidTokenResetPassword = async (token: string) => {
  const now = new Date();
  return await userRepository.findOne({
    where: {
      tokenResetPassword: token,
      tokenResetPasswordExpires: MoreThan(now),
    },
  });
};

export const resetPassword = async (user: User, password: string) => {
  user.password =  bcrypt.hashSync(password, 10);
  user.tokenResetPassword = null;
  user.tokenResetPasswordExpires = null;

  return await userRepository.save(user);
};

export const changePassword = async (user: User, password: string) => {
  user.password = bcrypt.hashSync(password, 10);

  return await userRepository.save(user);
};

export const updateProfile = async (user: User, data: any) => {
  user.name = data.name;
  user.gender = data.gender;
  user.phone = data.phone;
  user.dateOfBirth = data.dateOfBirth;
  user.avatar = data.avatar;
  user.address = data.address;

  return await userRepository.save(user);
};

export const getAllUsers = async () => {
  return await userRepository.find({
    where: {
      role: Role.USER,
    },
    order: {
      createdAt: 'DESC',
    },
  });
};
