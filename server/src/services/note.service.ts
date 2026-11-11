import { Note, INoteDocument } from '../models/note.model.js';
import { IUserDocument } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ROLES } from '../constants/roles.js';
import { CreateNoteInput, UpdateNoteInput } from '../validators/note.validator.js';

export const createNote = async (
  input: CreateNoteInput & { userId: any }
): Promise<INoteDocument> => {
  return Note.create({
    title: input.title,
    content: input.content,
    userId: input.userId
  });
};

export const getNotes = async ({
  user,
  page,
  limit
}: {
  user: IUserDocument;
  page: number;
  limit: number;
}): Promise<{ notes: any[]; total: number }> => {
  const skip = (page - 1) * limit;

  const query = user.role === ROLES.ADMIN ? {} : { userId: user._id };

  const [notes, total] = await Promise.all([
    Note.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Note.countDocuments(query)
  ]);

  return { notes, total };
};

export const getNoteById = async ({
  noteId,
  user
}: {
  noteId: string;
  user: IUserDocument;
}): Promise<any> => {
  const note = await Note.findById(noteId).populate('userId', 'name email role');
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  const noteOwner = note.userId as any;
  const noteOwnerId = noteOwner?._id
    ? noteOwner._id.toString()
    : noteOwner?.toString();

  if (user.role !== ROLES.ADMIN && noteOwnerId !== user._id.toString()) {
    throw new ApiError(403, 'Forbidden: You do not have permission to view this note');
  }

  return note;
};

export const updateNote = async ({
  noteId,
  user,
  updateData
}: {
  noteId: string;
  user: IUserDocument;
  updateData: UpdateNoteInput;
}): Promise<INoteDocument> => {
  const note = await Note.findById(noteId);
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  if (user.role === ROLES.ADMIN) {
    throw new ApiError(403, 'Administrators can only view notes');
  }

  if (note.userId.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Forbidden: You do not have permission to modify this note');
  }

  if (updateData.title !== undefined) note.title = updateData.title;
  if (updateData.content !== undefined) note.content = updateData.content;

  await note.save();
  return note;
};

export const deleteNote = async ({
  noteId,
  user
}: {
  noteId: string;
  user: IUserDocument;
}): Promise<{ id: string; deleted: boolean }> => {
  const note = await Note.findById(noteId);
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  if (user.role === ROLES.ADMIN) {
    throw new ApiError(403, 'Administrators can only view notes');
  }

  if (note.userId.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Forbidden: You do not have permission to delete this note');
  }

  await note.deleteOne();
  return { id: noteId, deleted: true };
};
