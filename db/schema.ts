import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const sources = sqliteTable("sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(), name: text("name").notNull(), category: text("category").notNull(),
  sourceType: text("source_type").notNull(), accessMethod: text("access_method").notNull(),
  url: text("url").notNull(), authorityTier: integer("authority_tier").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("sources_slug_unique").on(table.slug)]);

export const ingestionRuns = sqliteTable("ingestion_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }), sourceSlug: text("source_slug").notNull(),
  status: text("status").notNull(), recordsReceived: integer("records_received").notNull().default(0),
  latencyMs: integer("latency_ms"), message: text("message"),
  retrievedAt: text("retrieved_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const observations = sqliteTable("observations", {
  id: integer("id").primaryKey({ autoIncrement: true }), seriesId: text("series_id").notNull(),
  observationDate: text("observation_date").notNull(), value: real("value").notNull(),
  retrievedAt: text("retrieved_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("observations_series_date_unique").on(table.seriesId, table.observationDate)]);

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  status: text("status").notNull().default("developing"),
  confidence: integer("confidence").notNull().default(0),
  firstSeenAt: text("first_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("events_slug_unique").on(table.slug)]);

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceSlug: text("source_slug").notNull(),
  canonicalUrl: text("canonical_url").notNull(),
  title: text("title").notNull(),
  publishedAt: text("published_at"),
  retrievedAt: text("retrieved_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  contentHash: text("content_hash"),
}, (table) => [uniqueIndex("articles_canonical_url_unique").on(table.canonicalUrl)]);

export const eventArticles = sqliteTable("event_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull(),
  articleId: integer("article_id").notNull(),
  relevance: real("relevance").notNull().default(0),
}, (table) => [uniqueIndex("event_articles_unique").on(table.eventId, table.articleId)]);

export const claims = sqliteTable("claims", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull(),
  statement: text("statement").notNull(),
  classification: text("classification").notNull(),
  confidence: integer("confidence").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const citations = sqliteTable("citations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  claimId: integer("claim_id").notNull(),
  sourceSlug: text("source_slug").notNull(),
  url: text("url").notNull(),
  evidenceLabel: text("evidence_label").notNull(),
  supports: integer("supports", { mode: "boolean" }).notNull().default(true),
  retrievedAt: text("retrieved_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const entities = sqliteTable("entities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  canonicalName: text("canonical_name").notNull(),
  entityType: text("entity_type").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("entities_name_type_unique").on(table.canonicalName, table.entityType)]);

export const eventEntities = sqliteTable("event_entities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull(),
  entityId: integer("entity_id").notNull(),
  mentionCount: integer("mention_count").notNull().default(1),
  relevance: real("relevance").notNull().default(0),
}, (table) => [uniqueIndex("event_entities_unique").on(table.eventId, table.entityId)]);

export const claimRelations = sqliteTable("claim_relations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leftClaimId: integer("left_claim_id").notNull(),
  rightClaimId: integer("right_claim_id").notNull(),
  relation: text("relation").notNull(),
  confidence: integer("confidence").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("claim_relations_unique").on(table.leftClaimId, table.rightClaimId)]);

export const eventUpdates = sqliteTable("event_updates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull(),
  articleId: integer("article_id"),
  updateType: text("update_type").notNull(),
  headline: text("headline").notNull(),
  occurredAt: text("occurred_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
