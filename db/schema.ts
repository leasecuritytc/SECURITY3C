import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const quotes = sqliteTable("quotes", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().default("securitytc"),
  number: text("number").notNull(),
  customerName: text("customer_name").notNull(),
  serviceType: text("service_type").notNull(),
  serviceMode: text("service_mode").notNull().default("Não informado"),
  description: text("description").notNull().default(""),
  totalCents: integer("total_cents").notNull(),
  status: text("status").notNull().default("Rascunho"),
  validUntil: text("valid_until").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(""),
  deletedAt: text("deleted_at"),
}, (table) => [
  uniqueIndex("idx_quotes_company_number").on(table.companyId, table.number),
  index("idx_quotes_company_status").on(table.companyId, table.status),
]);

export const workOrders = sqliteTable("work_orders", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().default("securitytc"),
  number: text("number").notNull(),
  customerName: text("customer_name").notNull(),
  serviceType: text("service_type").notNull(),
  serviceMode: text("service_mode").notNull().default("Não informado"),
  status: text("status").notNull().default("Aberta"),
  scheduledAt: text("scheduled_at").notNull(),
  technician: text("technician").notNull(),
  issue: text("issue").notNull(),
  diagnosis: text("diagnosis").notNull().default(""),
  materials: text("materials").notNull().default(""),
  warranty: text("warranty").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(""),
  deletedAt: text("deleted_at"),
}, (table) => [
  uniqueIndex("idx_work_orders_company_number").on(table.companyId, table.number),
  index("idx_work_orders_company_status").on(table.companyId, table.status),
]);

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(), companyId: text("company_id").notNull().default("securitytc"),
  name: text("name").notNull(), personType: text("person_type").notNull(), document: text("document").notNull().default(""),
  contactName: text("contact_name").notNull().default(""), phone: text("phone").notNull().default(""), email: text("email").notNull().default(""),
  address: text("address").notNull().default(""), city: text("city").notNull().default(""), notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("Ativo"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(""), deletedAt: text("deleted_at"),
}, (table) => [index("idx_customers_company_name").on(table.companyId, table.name)]);

export const contracts = sqliteTable("contracts", {
  id: text("id").primaryKey(), companyId: text("company_id").notNull().default("securitytc"), number: text("number").notNull(),
  customerName: text("customer_name").notNull(), serviceMode: text("service_mode").notNull(), serviceType: text("service_type").notNull(),
  startDate: text("start_date").notNull(), endDate: text("end_date").notNull().default(""), totalCents: integer("total_cents").notNull(),
  status: text("status").notNull().default("Rascunho"), notes: text("notes").notNull().default(""),
  paymentTerms: text("payment_terms").notNull().default(""), warrantyTerms: text("warranty_terms").notNull().default(""),
  terminationPenaltyPercent: integer("termination_penalty_percent").notNull().default(0), clauses: text("clauses").notNull().default(""),
  signerName: text("signer_name").notNull().default(""), signerDocument: text("signer_document").notNull().default(""),
  signerEmail: text("signer_email").notNull().default(""), signedAt: text("signed_at").notNull().default(""),
  signatureHash: text("signature_hash").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`), updatedAt: text("updated_at").notNull().default(""), deletedAt: text("deleted_at"),
}, (table) => [uniqueIndex("idx_contracts_company_number").on(table.companyId, table.number), index("idx_contracts_company_status").on(table.companyId, table.status)]);

export const catalogItems = sqliteTable("catalog_items", {
  id: text("id").primaryKey(), companyId: text("company_id").notNull().default("securitytc"), name: text("name").notNull(),
  itemType: text("item_type").notNull(), serviceMode: text("service_mode").notNull(), category: text("category").notNull().default(""),
  unit: text("unit").notNull().default("un"), priceCents: integer("price_cents").notNull(), warranty: text("warranty").notNull().default(""),
  status: text("status").notNull().default("Ativo"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(""), deletedAt: text("deleted_at"),
}, (table) => [index("idx_catalog_company_name").on(table.companyId, table.name)]);

export const financeEntries = sqliteTable("finance_entries", {
  id: text("id").primaryKey(), companyId: text("company_id").notNull().default("securitytc"), customerName: text("customer_name").notNull(),
  reference: text("reference").notNull(), dueDate: text("due_date").notNull(), amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull().default("Pendente"), notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`), updatedAt: text("updated_at").notNull().default(""), deletedAt: text("deleted_at"),
}, (table) => [index("idx_finance_company_due_date").on(table.companyId, table.dueDate), index("idx_finance_company_status").on(table.companyId, table.status)]);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(), companyId: text("company_id").notNull().default("securitytc"), entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(), action: text("action").notNull(), description: text("description").notNull(), actorName: text("actor_name").notNull(),
  beforeJson: text("before_json").notNull().default(""), afterJson: text("after_json").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_audit_company_created_at").on(table.companyId, table.createdAt), index("idx_audit_entity").on(table.entityType, table.entityId)]);

export const servicePhotos = sqliteTable("service_photos", {
  id: text("id").primaryKey(), companyId: text("company_id").notNull().default("securitytc"),
  orderId: text("order_id").notNull(), objectKey: text("object_key").notNull(), fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(), sizeBytes: integer("size_bytes").notNull(), caption: text("caption").notNull().default(""),
  uploadedBy: text("uploaded_by").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_service_photos_order").on(table.orderId), uniqueIndex("idx_service_photos_object_key").on(table.objectKey)]);

export const leadRateLimits = sqliteTable("lead_rate_limits", {
  key: text("key").primaryKey(),
  windowStartedAt: integer("window_started_at").notNull(),
  requestCount: integer("request_count").notNull().default(1),
});

export const siteContent = sqliteTable("site_content", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().default("securitytc"),
  contentJson: text("content_json").notNull(),
  updatedBy: text("updated_by").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const portfolioItems = sqliteTable("portfolio_items", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().default("securitytc"),
  title: text("title").notNull(),
  area: text("area").notNull().default("Não informada"),
  serviceType: text("service_type").notNull(),
  serviceMode: text("service_mode").notNull(),
  city: text("city").notNull().default(""),
  completedAt: text("completed_at").notNull().default(""),
  summary: text("summary").notNull(),
  imageObjectKey: text("image_object_key").notNull(),
  imageName: text("image_name").notNull(),
  imageType: text("image_type").notNull(),
  altText: text("alt_text").notNull(),
  status: text("status").notNull().default("Rascunho"),
  sortOrder: integer("sort_order").notNull().default(0),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text("deleted_at"),
}, (table) => [
  index("idx_portfolio_company_status_sort").on(table.companyId, table.status, table.sortOrder),
]);
