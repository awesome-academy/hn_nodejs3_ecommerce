import { Length, ValidatorConstraint, ValidatorConstraintInterface, Validate, IsEnum } from 'class-validator';
import { Gender, LengthInput } from '../../constants';

@ValidatorConstraint({ name: 'isBeforeCurrentDate', async: false })
class IsBeforeCurrentDate implements ValidatorConstraintInterface {
  validate(dateOfBirth: string) {
    const currentDate = new Date();
    const dob = new Date(dateOfBirth);
    return dob < currentDate;
  }

  defaultMessage() {
    return 'error.dateOfBirthMustBeBeforeCurrentDate';
  }
}

class UpdateProfileDTO {
  @Length(LengthInput.MIN_LENGTH, LengthInput.MAX_LENGTH, { message: 'error.nameLengthError' })
  name: string;

  @Validate(IsBeforeCurrentDate)
  dateOfBirth: Date;

  @Length(LengthInput.MIN_LENGTH, LengthInput.MAX_LENGTH, { message: 'error.phoneLengthError' })
  phone: string;

  @Length(LengthInput.MIN_LENGTH_TEXT, LengthInput.MAX_LENGTH_TEXT, { message: 'error.addressLengthError' })
  address: string;

  @IsEnum(Gender, {message: 'error.genderInvalid'})
  gender: string;

  constructor(data: any) {
    this.name = data.name;
    this.dateOfBirth = data.dateOfBirth;
    this.phone = data.phone;
    this.address = data.address;
    this.gender = data.gender;
  }
}

export default UpdateProfileDTO;
