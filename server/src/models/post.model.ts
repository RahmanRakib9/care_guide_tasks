import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IPost {
  title: string;
  content: string;
  userId: Types.ObjectId | any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPostDocument extends IPost, Document {}

export type PostModel = Model<IPostDocument>;

const postSchema = new Schema<IPostDocument, PostModel>(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      minlength: [1, 'Content cannot be empty'],
      maxlength: [5000, 'Content cannot exceed 5000 characters']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// EXPLICIT INDEXES:
// 1. Compound index on { userId: 1, createdAt: -1 } supporting $lookup foreignField join
postSchema.index({ userId: 1, createdAt: -1 });

// 2. Single index on { createdAt: -1 } for public feed pagination
postSchema.index({ createdAt: -1 });

export const Post: PostModel = mongoose.model<IPostDocument, PostModel>('Post', postSchema);
