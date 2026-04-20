import { db } from '../services/db';
import type { Folder } from '../types';

export async function findAllFolders(): Promise<Folder[]> {
  return db.folders.orderBy('order').toArray();
}

export async function insertFolder(folder: Folder): Promise<void> {
  await db.folders.add(folder);
}

export async function updateFolder(id: string, changes: Partial<Folder>): Promise<void> {
  await db.folders.update(id, changes);
}

export async function deleteFolder(id: string): Promise<void> {
  const children = await db.folders.where('parentId').equals(id).toArray();
  for (const child of children) {
    await deleteFolder(child.id);
  }
  await db.notes.where('folderId').equals(id).delete();
  await db.folders.delete(id);
}
