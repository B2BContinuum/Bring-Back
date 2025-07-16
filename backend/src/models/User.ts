import { User as IUser, VerificationStatus } from 'bring-back-shared';

export class User implements IUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  profileImage?: string;
  address: IUser['address'];
  rating: number;
  totalDeliveries: number;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<IUser>) {
    this.id = data.id || '';
    this.email = data.email || '';
    this.name = data.name || '';
    this.phone = data.phone || '';
    this.profileImage = data.profileImage;
    this.address = data.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    };
    this.rating = data.rating || 0;
    this.totalDeliveries = data.totalDeliveries || 0;
    this.verificationStatus = data.verificationStatus || VerificationStatus.UNVERIFIED;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}