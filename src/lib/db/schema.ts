import {
  pgTable, pgEnum, text, timestamp, uuid,
  integer, boolean, jsonb, index, unique,
} from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────────────────────────

export const leadStatusEnum = pgEnum('lead_status', [
  'novo', 'em_atendimento', 'aguardando_resposta',
  'documentacao_analise', 'agendamento_visita', 'fechado', 'perdido',
]);
export const leadTemperatureEnum = pgEnum('lead_temperature', ['quente', 'morno', 'frio']);
export const leadOriginEnum = pgEnum('lead_origin', [
  'whatsapp', 'instagram_facebook', 'trafego_pago',
  'organico', 'indicacao', 'site', 'outro',
]);
export const contactTypeEnum = pgEnum('contact_type', [
  'whatsapp', 'ligacao', 'email', 'visita', 'outro',
]);
export const memberRoleEnum = pgEnum('member_role', ['admin', 'member']);
export const proposalStatusEnum = pgEnum('proposal_status', [
  'rascunho', 'enviada', 'visualizada', 'aceita', 'recusada',
]);
export const automationTriggerEnum = pgEnum('automation_trigger', [
  'lead_stage_changed', 'lead_no_contact',
  'followup_overdue', 'lead_temperature_changed', 'lead_closed',
]);

// ── profiles ───────────────────────────────────────────────────────────────

export const profiles = pgTable('profiles', {
  id:        uuid('id').primaryKey(),
  name:      text('name').notNull().default(''),
  email:     text('email').notNull().default(''),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ── organizations ─────────────────────────────────────────────────────────

export const organizations = pgTable('organizations', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name').notNull(),
  slug:      text('slug').unique().notNull(),
  logoUrl:   text('logo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ── organization_members ──────────────────────────────────────────────────

export const organizationMembers = pgTable('organization_members', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId:         uuid('user_id').notNull(),
  role:           memberRoleEnum('role').notNull().default('member'),
  invitedBy:      uuid('invited_by'),
  joinedAt:       timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  uniq:    unique().on(t.organizationId, t.userId),
  userIdx: index('idx_org_members_user').on(t.userId),
  orgIdx:  index('idx_org_members_org').on(t.organizationId),
}));

// ── leads ─────────────────────────────────────────────────────────────────

export const leads = pgTable('leads', {
  id:               uuid('id').primaryKey().defaultRandom(),
  organizationId:   uuid('organization_id').notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  assignedTo:       uuid('assigned_to'),

  name:             text('name').notNull(),
  phone:            text('phone').notNull(),
  origin:           leadOriginEnum('origin').notNull(),
  productInterest:  text('product_interest'),
  observations:     text('observations'),

  status:           leadStatusEnum('status').notNull().default('novo'),
  temperature:      leadTemperatureEnum('temperature').notNull().default('morno'),
  pipelinePosition: integer('pipeline_position').default(0),

  estimatedIncome:  text('estimated_income'),
  downPayment:      text('down_payment'),
  specificInterest: text('specific_interest'),
  recurringDoubts:  text('recurring_doubts'),
  mainObjection:    text('main_objection'),
  lossReason:       text('loss_reason'),

  lastContactAt:    timestamp('last_contact_at', { withTimezone: true }),
  nextFollowupAt:   timestamp('next_followup_at', { withTimezone: true }),
  closedAt:         timestamp('closed_at', { withTimezone: true }),

  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt:        timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  orgIdx:      index('idx_leads_org').on(t.organizationId),
  statusIdx:   index('idx_leads_status').on(t.organizationId, t.status),
  originIdx:   index('idx_leads_origin').on(t.organizationId, t.origin),
  followupIdx: index('idx_leads_followup').on(t.organizationId, t.nextFollowupAt),
}));

// ── lead_history ──────────────────────────────────────────────────────────

export const leadHistory = pgTable('lead_history', {
  id:             uuid('id').primaryKey().defaultRandom(),
  leadId:         uuid('lead_id').notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdBy:      uuid('created_by').notNull(),

  contactType:    contactTypeEnum('contact_type').notNull().default('whatsapp'),
  summary:        text('summary').notNull(),
  objections:     text('objections'),
  realInterest:   text('real_interest'),
  nextStep:       text('next_step'),
  nextStepDate:   timestamp('next_step_date', { withTimezone: true }),

  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  leadIdx:     index('idx_history_lead').on(t.leadId),
  nextStepIdx: index('idx_history_next_step').on(t.organizationId, t.nextStepDate),
}));

// ── proposals ─────────────────────────────────────────────────────────────

export const proposals = pgTable('proposals', {
  id:             uuid('id').primaryKey().defaultRandom(),
  leadId:         uuid('lead_id').notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdBy:      uuid('created_by').notNull(),

  title:          text('title').notNull(),
  version:        integer('version').notNull().default(1),
  status:         proposalStatusEnum('status').notNull().default('rascunho'),
  items:          jsonb('items').notNull().default([]),
  paymentTerms:   text('payment_terms'),
  validityDays:   integer('validity_days').default(15),
  notes:          text('notes'),
  publicToken:    text('public_token').unique(),

  sentAt:         timestamp('sent_at', { withTimezone: true }),
  viewedAt:       timestamp('viewed_at', { withTimezone: true }),
  acceptedAt:     timestamp('accepted_at', { withTimezone: true }),
  rejectedAt:     timestamp('rejected_at', { withTimezone: true }),
  acceptedName:   text('accepted_name'),

  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  leadIdx: index('idx_proposals_lead').on(t.leadId),
  orgIdx:  index('idx_proposals_org').on(t.organizationId),
}));
