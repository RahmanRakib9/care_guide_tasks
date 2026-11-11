import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, ROLE_VALUES, UserRole } from '../constants/roles';
import { USER_INTERESTS_VALUES } from '../constants/interests';

export interface IUser {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  interests: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserModel = Model<IUserDocument>;

const userSchema = new Schema<IUserDocument, UserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ROLE_VALUES,
        message: '{VALUE} is not a valid role'
      },
      default: ROLES.USER
    },
    interests: {
      type: [String],
      enum: {
        values: USER_INTERESTS_VALUES,
        message: '{VALUE} is not a supported interest',
      },
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform: function (_doc, ret: any) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// EXPLICIT INDEXES:
// 1. Unique index on email: Supports O(1) lookup during login/registration duplicate check
userSchema.index({ email: 1 }, { unique: true });

// 2. Index on createdAt: Supports stable descending sort on paginated admin user listing
userSchema.index({ createdAt: -1 });

// 3. Multikey index on interests array: Supports filtering users by interest & unwinding interests in aggregation
userSchema.index({ interests: 1 });

export const User: UserModel = mongoose.model<IUserDocument, UserModel>('User', userSchema);
