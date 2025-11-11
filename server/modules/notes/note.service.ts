import { prisma } from "../../lib/prisma";
import { CustomError } from "../../utils/customError";

export const getAllNotes = async (userId: string) => {
  return await prisma.note.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const getNoteById = async (id: string) => {
  return await prisma.note.findUnique({ where: { id } });
};

export const createNote = async (data: {
  title: string;
  content: string;
  tags?: string[];
  userId: string;
}) => {
  return await prisma.note.create({ data });
};

export const updateNote = async (id: string, data: any) => {
  const existing = await prisma.note.findUnique({ where: { id } });
  if (!existing) throw new CustomError("Note not found", 404);

  return await prisma.note.update({
    where: { id },
    data: {
      title: data.title ?? existing.title,
      content: data.content ?? existing.content,
      tags: data.tags ?? existing.tags,
    },
  });
};

export const deleteNote = async (id: string) => {
  const existing = await prisma.note.findUnique({ where: { id } });
  if (!existing) throw new CustomError("Note not found", 404);

  await prisma.note.delete({ where: { id } });
};

export const importNotes = async (notesData: any[], userId: string) => {
  const notesToCreate = notesData.map((n) => ({
    title: n.title,
    content: n.content,
    tags: n.tags ?? [],
    userId,
  }));

  return await prisma.note.createMany({ data: notesToCreate });
};

export const searchNotes = async (query: string, userId: string) => {
  return await prisma.note.findMany({
    where: {
      userId,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { tags: { hasSome: [query] } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
};
