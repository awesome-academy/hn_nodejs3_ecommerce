export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum LengthInput {
  MIN_LENGTH = 6,
  MAX_LENGTH = 20,

  MIN_LENGTH_TEXT = 1,
  MAX_LENGTH_TEXT = 255,
}

export enum Query {
  PAGE_DEFAULT = 1,
  LIMIT_DEFAULT = 9,
}

export enum ErrorCode {
  NOT_FOUND = 404,
  BAD_REQUEST = 400
}

export enum Status {
  SUCCESS = 'Success',
  FAIL = 'Fail',
  ERROR = 'Error',
}

export enum EntityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const CATEGORY_WORKSHEET_COLUMNS = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 30 },
];

export const COUPON_WORKSHEET_COLUMNS = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 30 },
  { header: 'Percentage', key: 'percentage', width: 30 },
  { header: 'Start Date', key: 'startDate', width: 30 },
  { header: 'End Date', key: 'endDate', width: 30 },
];

export const ORDER_WORKSHEET_COLUMNS = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'User', key: 'user', width: 30 },
  { header: 'Coupon', key: 'coupon', width: 30 },
  { header: 'Total', key: 'total', width: 15 },
  { header: 'Name', key: 'name', width: 30 },
  { header: 'Phone', key: 'phone', width: 15 },
  { header: 'Email', key: 'email', width: 30 },
  { header: 'Payment Method', key: 'paymentMethod', width: 20 },
  { header: 'Status', key: 'status', width: 15 },
  { header: 'Address', key: 'address', width: 50 },
  { header: 'Reason Reject', key: 'reasonReject', width: 50 },
  { header: 'Note', key: 'note', width: 50 },
  { header: 'Proof', key: 'proof', width: 50 },
];

export const PRODUCT_WORKSHEET_COLUMNS = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 30 },
  { header: 'Category', key: 'category', width: 30 },
  { header: 'Price', key: 'price', width: 15 },
  { header: 'Description', key: 'description', width: 50 },
  { header: 'Quantity', key: 'quantity', width: 15 },
  { header: 'Rating Avg', key: 'ratingAvg', width: 15 },
  { header: 'Quantity Sold', key: 'quantitySold', width: 15 },
  { header: 'Is Active', key: 'isActive', width: 10 },
];

export const USER_WORKSHEET_COLUMNS = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 30 },
  { header: 'Email', key: 'email', width: 30 },
  { header: 'Password', key: 'password', width: 30 },
  { header: 'Role', key: 'role', width: 10 },
  { header: 'Phone', key: 'phone', width: 15 },
  { header: 'Gender', key: 'gender', width: 10 },
  { header: 'Date of Birth', key: 'dateOfBirth', width: 15 },
  { header: 'Avatar', key: 'avatar', width: 30 },
  { header: 'Address', key: 'address', width: 50 },
  { header: 'Is Active', key: 'isActive', width: 10 },
  { header: 'Token Active', key: 'tokenActive', width: 30 },
  { header: 'Token Active Expires', key: 'tokenActiveExpires', width: 20 },
  { header: 'Token Reset Password', key: 'tokenResetPassword', width: 30 },
  { header: 'Token Reset Password Expires', key: 'tokenResetPasswordExpires', width: 20 },
];
