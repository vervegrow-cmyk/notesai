/**
 * JSON-file DB adapter.
 * Each collection maps to one JSON file under backend/db/{name}.json.
 * Reads are in-memory (loaded once); writes flush to disk immediately.
 *
 * Usage:
 *   import { getCollection } from '../../backend/db/index.js';
 *   const col = getCollection('inquiries');
 *   col.findAll()
 *   col.findById(id)
 *   col.findWhere(predicate)
 *   col.insert(doc)       // adds id + createdAt if missing
 *   col.update(id, patch) // merges patch, sets updatedAt
 *   col.remove(id)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));

// In-memory cache: collectionName → Map<id, doc>
const cache = new Map();

function filePath(name) {
  return path.join(__dir, `${name}.json`);
}

function load(name) {
  if (cache.has(name)) return cache.get(name);

  const fp = filePath(name);
  let records = [];

  if (fs.existsSync(fp)) {
    try {
      records = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    } catch {
      records = [];
    }
  }

  const map = new Map(records.map(r => [r.id, r]));
  cache.set(name, map);
  return map;
}

function flush(name) {
  const map = load(name);
  const records = Array.from(map.values());
  fs.writeFileSync(filePath(name), JSON.stringify(records, null, 2), 'utf-8');
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getCollection(name) {
  const map = load(name);

  return {
    findAll() {
      return Array.from(map.values());
    },

    findById(id) {
      return map.get(id) ?? null;
    },

    findWhere(predicate) {
      return Array.from(map.values()).filter(predicate);
    },

    insert(doc) {
      const record = {
        id: doc.id ?? newId(),
        ...doc,
        createdAt: doc.createdAt ?? new Date().toISOString(),
      };
      map.set(record.id, record);
      flush(name);
      return record;
    },

    update(id, patch) {
      const existing = map.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
      map.set(id, updated);
      flush(name);
      return updated;
    },

    remove(id) {
      const existed = map.has(id);
      map.delete(id);
      if (existed) flush(name);
      return existed;
    },

    count(predicate) {
      if (!predicate) return map.size;
      return Array.from(map.values()).filter(predicate).length;
    },
  };
}
