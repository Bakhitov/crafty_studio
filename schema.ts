import { sql } from 'drizzle-orm';
import {
  boolean,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

const uuid = sql`uuid_generate_v4()`;

export const projects = pgTable('project', {
  id: text('id').primaryKey().default(uuid).notNull(),
  name: varchar('name').notNull(),
  transcriptionModel: varchar('transcription_model').notNull(),
  visionModel: varchar('vision_model').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
  content: json('content'),
  userId: varchar('user_id').notNull(),
  image: varchar('image'),
  members: text('members').array(),
  welcomeProject: boolean('demo_project').notNull().default(false),
});

export const profile = pgTable('profile', {
  id: text('id').primaryKey().notNull(),
  customerId: text('customer_id'),
  subscriptionId: text('subscription_id'),
  productId: text('product_id'),
  onboardedAt: timestamp('onboarded_at'),
});

export const projectMessages = pgTable('project_message', {
  id: text('id').primaryKey().default(uuid).notNull(),
  projectId: text('project_id').notNull(),
  userId: text('user_id'),
  role: varchar('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Canonical tags with i18n labels
export const tags = pgTable('tag', {
  id: text('id').primaryKey().default(uuid).notNull(),
  keyEn: varchar('key_en').notNull(), // unique key in English
  labels: json('labels').notNull(), // Record<lang,string>
  synonyms: json('synonyms'), // Record<lang,string[]>
  isPublic: boolean('is_public').notNull().default(true),
  createdByUserId: text('created_by_user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Stored prompts per user/project
export const prompts = pgTable('prompt', {
  id: text('id').primaryKey().default(uuid).notNull(),
  userId: text('user_id').notNull(),
  projectId: text('project_id'),
  modality: varchar('modality').notNull(), // Image|Text|Audio|Video
  textRaw: text('text_raw'),
  tagsEn: text('tags_en').array(), // denormalized english tags
  jsonPayload: json('json_payload'),
  model: varchar('model'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Junction between prompts and tags
export const promptTags = pgTable('prompt_tag', {
  promptId: text('prompt_id').notNull(),
  tagId: text('tag_id').notNull(),
  source: varchar('source').notNull().default('user'), // user|suggested|auto
  orderIdx: varchar('order_idx'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
