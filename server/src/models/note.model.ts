import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface INote {
  title: string;
  content: string;
  userId: Types.ObjectId | any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INoteDocument extends INote, Document {}

export type NoteModel = Model<INoteDocument>;

const noteSchema = new Schema<INoteDocument, NoteModel>(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
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
// 1. Compound index on { userId: 1, createdAt: -1 } adhering to ESR rule
noteSchema.index({ userId: 1, createdAt: -1 });

// 2. Single index on { createdAt: -1 } for admin listing across all users
noteSchema.index({ createdAt: -1 });

export const Note: NoteModel = mongoose.model<INoteDocument, NoteModel>('Note', noteSchema);
