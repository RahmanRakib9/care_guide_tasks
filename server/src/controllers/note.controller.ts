import { Request, Response, NextFunction } from 'express';
import * as noteService from '../services/note.service.js';
import { sendResponse } from '../utils/apiResponse.js';
import { getPaginationParams, formatPaginationMeta } from '../utils/pagination.js';

export const createNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const note = await noteService.createNote({
      title: req.body.title,
      content: req.body.content,
      userId: req.user!._id
    });
    sendResponse(res, 201, 'Note created successfully', { note });
  } catch (error) {
    next(error);
  }
};

export const getNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const { notes, total } = await noteService.getNotes({
      user: req.user!,
      page,
      limit
    });
    const pagination = formatPaginationMeta(total, page, limit);
    sendResponse(res, 200, 'Notes retrieved successfully', { notes }, pagination);
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const note = await noteService.getNoteById({
      noteId,
      user: req.user!
    });
    sendResponse(res, 200, 'Note retrieved successfully', { note });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const note = await noteService.updateNote({
      noteId,
      user: req.user!,
      updateData: req.body
    });
    sendResponse(res, 200, 'Note updated successfully', { note });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await noteService.deleteNote({
      noteId,
      user: req.user!
    });
    sendResponse(res, 200, 'Note deleted successfully', result);
  } catch (error) {
    next(error);
  }
};
