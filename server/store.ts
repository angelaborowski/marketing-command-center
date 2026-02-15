/**
 * JSON File Storage for Server-Side Data
 *
 * Stores batches, server settings, and cron execution logs
 * as JSON files in server/data/.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { ContentItem } from '../src/types';

// ============================================================================
// Types
// ============================================================================

export interface ContentBatchItem {
  tempId: string;
  status: 'pending' | 'approved' | 'rejected';
  content: Omit<ContentItem, 'id' | 'filmed' | 'posted'>;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface ContentBatch {
  id: string;
  createdAt: string;
  trigger: 'cron' | 'manual';
  status: 'pending' | 'approved' | 'partial' | 'rejected';
  items: ContentBatchItem[];
  pipelineSummary: string;
}

export interface ServerSettings {
  cronSchedule: string;
  batchSize: number;
  platforms: string[];
  subjects: string[];
  levels: string[];
}

export interface CronLogEntry {
  timestamp: string;
  status: 'success' | 'error';
  batchId?: string;
  error?: string;
  itemCount?: number;
}

// ============================================================================
// Paths
// ============================================================================

const DATA_DIR = path.join(import.meta.dirname, 'data');
const BATCHES_DIR = path.join(DATA_DIR, 'batches');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');
const CRON_LOG_PATH = path.join(DATA_DIR, 'cron-log.json');

// ============================================================================
// Helpers
// ============================================================================

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function ensureDataDirs(): void {
  ensureDir(DATA_DIR);
  ensureDir(BATCHES_DIR);
}

// ============================================================================
// Batch Storage
// ============================================================================

export function saveBatch(batch: ContentBatch): void {
  ensureDataDirs();
  const filePath = path.join(BATCHES_DIR, `${batch.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(batch, null, 2));
}

export function loadBatch(batchId: string): ContentBatch | null {
  ensureDataDirs();
  const filePath = path.join(BATCHES_DIR, `${batchId}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as ContentBatch;
}

export function listBatches(): Omit<ContentBatch, 'items'>[] {
  ensureDataDirs();
  const files = fs.readdirSync(BATCHES_DIR).filter(f => f.endsWith('.json'));

  const batches = files.map(file => {
    const raw = fs.readFileSync(path.join(BATCHES_DIR, file), 'utf-8');
    const batch = JSON.parse(raw) as ContentBatch;
    return {
      id: batch.id,
      createdAt: batch.createdAt,
      trigger: batch.trigger,
      status: batch.status,
      pipelineSummary: batch.pipelineSummary,
      itemCount: batch.items.length,
      pendingCount: batch.items.filter(i => i.status === 'pending').length,
      approvedCount: batch.items.filter(i => i.status === 'approved').length,
      rejectedCount: batch.items.filter(i => i.status === 'rejected').length,
    };
  });

  // Sort newest first
  batches.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return batches;
}

export function updateBatchItemStatus(
  batchId: string,
  tempId: string,
  status: 'approved' | 'rejected'
): ContentBatch | null {
  const batch = loadBatch(batchId);
  if (!batch) return null;

  const item = batch.items.find(i => i.tempId === tempId);
  if (!item) return null;

  item.status = status;
  if (status === 'approved') {
    item.approvedAt = new Date().toISOString();
  } else {
    item.rejectedAt = new Date().toISOString();
  }

  // Recalculate batch status
  const allApproved = batch.items.every(i => i.status === 'approved');
  const allRejected = batch.items.every(i => i.status === 'rejected');
  const anyApproved = batch.items.some(i => i.status === 'approved');
  const anyPending = batch.items.some(i => i.status === 'pending');

  if (allApproved) batch.status = 'approved';
  else if (allRejected) batch.status = 'rejected';
  else if (anyApproved && !anyPending) batch.status = 'partial';
  else batch.status = 'pending';

  saveBatch(batch);
  return batch;
}

export function approveAllItems(batchId: string): ContentBatch | null {
  const batch = loadBatch(batchId);
  if (!batch) return null;

  const now = new Date().toISOString();
  for (const item of batch.items) {
    if (item.status === 'pending') {
      item.status = 'approved';
      item.approvedAt = now;
    }
  }

  batch.status = batch.items.every(i => i.status === 'approved') ? 'approved' : 'partial';
  saveBatch(batch);
  return batch;
}

export function getApprovedItems(batchId: string): ContentItem[] {
  const batch = loadBatch(batchId);
  if (!batch) return [];

  return batch.items
    .filter(i => i.status === 'approved')
    .map((item, index) => ({
      ...item.content,
      id: `${batchId}-${index}-${Date.now().toString(36)}`,
      filmed: false,
      posted: false,
    } as ContentItem));
}

// ============================================================================
// Server Settings
// ============================================================================

const DEFAULT_SERVER_SETTINGS: ServerSettings = {
  cronSchedule: '0 9 * * 5', // Every Friday at 9 AM
  batchSize: 120,
  platforms: ['tiktok', 'shorts', 'reels', 'facebook', 'linkedin', 'ytlong', 'reddit', 'mumsnet'],
  subjects: ['Biology', 'Chemistry', 'Physics', 'Maths'],
  levels: ['GCSE', 'A-Level'],
};

export function loadServerSettings(): ServerSettings {
  ensureDataDirs();
  if (!fs.existsSync(SETTINGS_PATH)) {
    saveServerSettings(DEFAULT_SERVER_SETTINGS);
    return DEFAULT_SERVER_SETTINGS;
  }
  const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
  return JSON.parse(raw) as ServerSettings;
}

export function saveServerSettings(settings: ServerSettings): void {
  ensureDataDirs();
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

// ============================================================================
// Cron Log
// ============================================================================

export function appendCronLog(entry: CronLogEntry): void {
  ensureDataDirs();
  let log: CronLogEntry[] = [];
  if (fs.existsSync(CRON_LOG_PATH)) {
    const raw = fs.readFileSync(CRON_LOG_PATH, 'utf-8');
    log = JSON.parse(raw);
  }

  log.unshift(entry); // Newest first

  // Keep last 100 entries
  if (log.length > 100) {
    log = log.slice(0, 100);
  }

  fs.writeFileSync(CRON_LOG_PATH, JSON.stringify(log, null, 2));
}

export function getCronLog(limit = 50): CronLogEntry[] {
  ensureDataDirs();
  if (!fs.existsSync(CRON_LOG_PATH)) return [];
  const raw = fs.readFileSync(CRON_LOG_PATH, 'utf-8');
  const log = JSON.parse(raw) as CronLogEntry[];
  return log.slice(0, limit);
}
