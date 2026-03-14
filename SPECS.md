SPECS - CloseCRM
> Versão 2.0 — Supabase Auth (sem Clerk)
---
ÍNDICE DE MUDANÇAS NESTA VERSÃO
Esta versão substitui completamente o Clerk por Supabase Auth. Resumo das trocas:
Antes (Clerk)	Depois (Supabase Auth)
`@clerk/nextjs` middleware	`@supabase/ssr` + middleware nativo Next.js
`auth()` do Clerk	`supabase.auth.getUser()` server-side
`clerk_org_id` nas tabelas	`organization_id` UUID puro (sem external ref)
`clerk_user_id` nas tabelas	`id` referenciando `auth.users(id)` nativo
Organizations do Clerk	Tabelas `organizations` + `organization_members`
Webhook Clerk → Supabase	Eliminado — Supabase Auth é a fonte da verdade
RLS via `current_setting(app.org_id)`	RLS via `auth.uid()` nativo do Supabase
Páginas `/sign-in/[[...sign-in]]`	Página `/sign-in` com formulário próprio
Convite via Clerk Organizations	`supabase.auth.admin.inviteUserByEmail()`
---
STACK TECNOLÓGICA
Frontend
Framework: Next.js 14+ (App Router)
Linguagem: TypeScript 5+
UI Library: shadcn/ui + Radix UI
Styling: Tailwind CSS 3.4+
State Management:
Zustand (estado local: filtros, painel lateral, drag state)
TanStack Query v5 (server state: leads, pipeline, histórico)
Forms: React Hook Form + Zod
Drag and Drop: @dnd-kit/core + @dnd-kit/sortable
Datas: date-fns
Gráficos: Recharts
Ícones: Lucide React
Backend & Database
Database: Supabase (PostgreSQL)
Auth: Supabase Auth (email/senha + Google OAuth)
ORM: Drizzle ORM
API: Next.js Server Actions
Realtime: Supabase Realtime (pipeline multi-usuário)
Storage: Supabase Storage (logos de empresa, anexos de proposta)
Email
Provider: Resend
Templates: React Email
Tipos: boas-vindas, convite de membro, digest de follow-up, notificação de proposta visualizada, relatórios agendados
Infraestrutura
Hosting: Vercel
Repository: GitHub
CI/CD: GitHub Actions + Vercel
Monitoring: Vercel Analytics + Sentry
---
PACOTES: REMOVER E ADICIONAR
❌ Remover
```bash
npm uninstall @clerk/nextjs @clerk/backend svix
```
✅ Adicionar
```bash
npm install @supabase/supabase-js @supabase/ssr
```
> `@supabase/ssr` é o pacote oficial para Next.js App Router.
> Substitui o legado `@supabase/auth-helpers-nextjs` — não usar o legado.
Pacotes que permanecem inalterados
```
drizzle-orm            date-fns
drizzle-kit            recharts
postgres               zustand
resend                 @tanstack/react-query
react-email            react-hook-form
@dnd-kit/core          zod
@dnd-kit/sortable      lucide-react
```
---
LISTA DE ARQUIVOS ALTERADOS
Deletar completamente
```
app/api/webhooks/clerk/route.ts           ← não existe mais
app/(auth)/sign-in/[[...sign-in]]/        ← pasta inteira deletada
app/(auth)/sign-up/[[...sign-up]]/        ← pasta inteira deletada
lib/supabase/rls.ts                       ← RLS agora é nativo via auth.uid()
```
Reescrever do zero
```
middleware.ts                             ← novo, baseado em @supabase/ssr
lib/supabase/server.ts                    ← novo client server-side
lib/supabase/client.ts                    ← novo client browser
lib/db/schema.ts                          ← sem clerk_user_id / clerk_org_id
lib/actions/leads.ts                      ← substituir auth() por getUser()
lib/actions/history.ts                    ← idem
lib/actions/followup.ts                   ← idem
```
Criar novos
```
lib/supabase/admin.ts                     ← client service_role (convites)
lib/auth/get-user.ts                      ← helper central de autenticação
lib/auth/get-membership.ts               ← retorna org do usuário autenticado
lib/actions/organizations.ts             ← criar org no onboarding
app/(auth)/sign-in/page.tsx              ← formulário próprio
app/(auth)/sign-up/page.tsx              ← formulário próprio
app/(auth)/reset-password/page.tsx       ← recuperação de senha
app/auth/confirm/page.tsx                ← callback OAuth e confirmação
app/(onboarding)/onboarding/page.tsx     ← criação de organização
app/api/invites/route.ts                 ← convite de membros
```
Atualizar
```
app/(app)/layout.tsx                      ← remover ClerkProvider
app/(app)/settings/page.tsx              ← convite de membros via nova API
```
---
SCHEMA DO BANCO DE DADOS
Convenções
`id` nas tabelas de app usam `UUID DEFAULT gen_random_uuid()`
A tabela `profiles` usa `id UUID` que referencia `auth.users(id)` diretamente — sem coluna extra `clerk_user_id`
RLS usa `auth.uid()` nativo — sem `current_setting` ou contexto externo
Toda tabela multi-tenant tem `organization_id` com policy baseada em subquery na `organization_members`
Soft deletes via `deleted_at TIMESTAMPTZ`
---
Migration 001 — Enums
```sql
-- 001_enums.sql

CREATE TYPE lead_status AS ENUM (
  'novo', 'em_atendimento', 'aguardando_resposta',
  'documentacao_analise', 'agendamento_visita', 'fechado', 'perdido'
);

CREATE TYPE lead_temperature AS ENUM ('quente', 'morno', 'frio');

CREATE TYPE lead_origin AS ENUM (
  'whatsapp', 'instagram_facebook', 'trafego_pago',
  'organico', 'indicacao', 'site', 'outro'
);

CREATE TYPE contact_type AS ENUM (
  'whatsapp', 'ligacao', 'email', 'visita', 'outro'
);

CREATE TYPE member_role AS ENUM ('admin', 'member');

CREATE TYPE proposal_status AS ENUM (
  'rascunho', 'enviada', 'visualizada', 'aceita', 'recusada'
);

CREATE TYPE automation_trigger AS ENUM (
  'lead_stage_changed', 'lead_no_contact',
  'followup_overdue', 'lead_temperature_changed', 'lead_closed'
);
```
---
Migration 002 — Profiles
```sql
-- 002_profiles.sql
-- Espelha auth.users e armazena dados extras de perfil.
-- Criado automaticamente pelo trigger quando usuário confirma e-mail.
-- NÃO armazena senha — responsabilidade exclusiva do Supabase Auth.

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: cria perfil automaticamente ao confirmar e-mail
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê e edita seu próprio perfil"
  ON profiles FOR ALL
  USING (id = auth.uid());

-- Membros da mesma org podem ver perfis uns dos outros
-- (necessário para exibir "responsável" nos cards do pipeline)
CREATE POLICY "Membros da mesma org veem perfis"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM organization_members
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );
```
---
Migration 003 — Organizations
```sql
-- 003_organizations.sql

CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem sua organização"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins atualizam a organização"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Permite inserção durante o onboarding (criador da org)
CREATE POLICY "Usuário autenticado pode criar organização"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```
---
Migration 004 — Organization Members
```sql
-- 004_organization_members.sql
-- Tabela central de multi-tenancy: relaciona usuário <-> organização com papel.

CREATE TABLE organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            member_role NOT NULL DEFAULT 'member',
  invited_by      UUID REFERENCES auth.users(id),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org  ON organization_members(organization_id);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem outros membros da mesma org"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins gerenciam membros"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Permite o criador da org inserir a si mesmo como admin no onboarding
CREATE POLICY "Usuário pode ingressar em org"
  ON organization_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
```
---
Migration 005 — Leads
```sql
-- 005_leads.sql

CREATE TABLE leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_to         UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  name                TEXT NOT NULL,
  phone               TEXT NOT NULL,
  origin              lead_origin NOT NULL,
  product_interest    TEXT,
  observations        TEXT,

  status              lead_status NOT NULL DEFAULT 'novo',
  temperature         lead_temperature NOT NULL DEFAULT 'morno',
  pipeline_position   INTEGER DEFAULT 0,

  estimated_income    TEXT,
  down_payment        TEXT,
  specific_interest   TEXT,
  recurring_doubts    TEXT,
  main_objection      TEXT,
  loss_reason         TEXT,

  last_contact_at     TIMESTAMPTZ,
  next_followup_at    TIMESTAMPTZ,
  closed_at           TIMESTAMPTZ,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_leads_org      ON leads(organization_id);
CREATE INDEX idx_leads_status   ON leads(organization_id, status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_origin   ON leads(organization_id, origin);
CREATE INDEX idx_leads_followup ON leads(organization_id, next_followup_at);
CREATE INDEX idx_leads_contact  ON leads(organization_id, last_contact_at);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros acessam leads da sua org"
  ON leads FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );
```
---
Migration 006 — Lead History
```sql
-- 006_lead_history.sql

CREATE TABLE lead_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES auth.users(id),

  contact_type    contact_type NOT NULL DEFAULT 'whatsapp',
  summary         TEXT NOT NULL,
  objections      TEXT,
  real_interest   TEXT,
  next_step       TEXT,
  next_step_date  TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_history_lead      ON lead_history(lead_id);
CREATE INDEX idx_history_org       ON lead_history(organization_id);
CREATE INDEX idx_history_next_step ON lead_history(organization_id, next_step_date);

ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros acessam histórico da sua org"
  ON lead_history FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```
---
Migration 007 — Proposals
```sql
-- 007_proposals.sql

CREATE TABLE proposals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES auth.users(id),

  title           TEXT NOT NULL,
  version         INTEGER NOT NULL DEFAULT 1,
  status          proposal_status NOT NULL DEFAULT 'rascunho',
  items           JSONB NOT NULL DEFAULT '[]',
  payment_terms   TEXT,
  validity_days   INTEGER DEFAULT 15,
  notes           TEXT,
  public_token    TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),

  sent_at         TIMESTAMPTZ,
  viewed_at       TIMESTAMPTZ,
  accepted_at     TIMESTAMPTZ,
  rejected_at     TIMESTAMPTZ,
  accepted_name   TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposals_lead ON proposals(lead_id);
CREATE INDEX idx_proposals_org  ON proposals(organization_id);
CREATE UNIQUE INDEX idx_proposals_token ON proposals(public_token);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros acessam propostas da sua org"
  ON proposals FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Acesso público por token para o cliente visualizar sem login
CREATE POLICY "Acesso público por token"
  ON proposals FOR SELECT
  USING (public_token IS NOT NULL);
```
---
Migration 008 — Email Automations
```sql
-- 008_automations.sql

CREATE TABLE email_automations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES auth.users(id),

  name            TEXT NOT NULL,
  trigger         automation_trigger NOT NULL,
  trigger_config  JSONB DEFAULT '{}',
  template_subject TEXT NOT NULL,
  template_body   TEXT NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  cooldown_days   INTEGER DEFAULT 7,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_automation_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id   UUID NOT NULL REFERENCES email_automations(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  recipient_email TEXT NOT NULL,
  status          TEXT DEFAULT 'sent',
  error_message   TEXT
);

CREATE INDEX idx_automation_org      ON email_automations(organization_id);
CREATE INDEX idx_automation_logs_lead ON email_automation_logs(lead_id);

ALTER TABLE email_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros acessam automações da sua org"
  ON email_automations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros acessam logs da sua org"
  ON email_automation_logs FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```
---
DRIZZLE ORM SCHEMA
```typescript
// lib/db/schema.ts
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
// id = auth.users(id) — criado automaticamente pelo trigger no banco.
// Não usar .defaultRandom() aqui: o id vem do Supabase Auth.

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
  userId:         uuid('user_id').notNull(),   // referencia auth.users(id)
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
  assignedTo:       uuid('assigned_to'),       // referencia auth.users(id)

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
  createdBy:      uuid('created_by').notNull(),  // referencia auth.users(id)

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
```
---
SUPABASE AUTH — SETUP NO PAINEL
1. Habilitar Google OAuth
```
Supabase Dashboard → Authentication → Providers → Google
  → Client ID:     (Google Cloud Console → Credenciais → OAuth 2.0)
  → Client Secret: (Google Cloud Console)
  → Callback URL:  https://[project-id].supabase.co/auth/v1/callback
     (copiar este URL e colar nas origens autorizadas do Google Cloud)
```
2. Configurar URLs de redirecionamento
```
Supabase Dashboard → Authentication → URL Configuration
  Site URL:       https://closecrm.app
  Redirect URLs:
    https://closecrm.app/auth/confirm
    http://localhost:3000/auth/confirm
```
3. Desabilitar confirmação de e-mail em dev (opcional)
```
Supabase Dashboard → Authentication → Settings
  → "Enable email confirmations" → OFF   (apenas desenvolvimento)
```
---
CLIENTES SUPABASE
```typescript
// lib/supabase/server.ts
// Para Server Components, Server Actions e Route Handlers
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name)              { return cookieStore.get(name)?.value; },
        set(name, value, opts) { try { cookieStore.set({ name, value, ...opts }); } catch {} },
        remove(name, opts)     { try { cookieStore.set({ name, value: '', ...opts }); } catch {} },
      },
    }
  );
}
```
```typescript
// lib/supabase/client.ts
// Para Client Components
'use client';
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```
```typescript
// lib/supabase/admin.ts
// Apenas em Route Handlers server-side — NUNCA expor no cliente
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```
---
AUTH HELPERS CENTRAIS
```typescript
// lib/auth/get-user.ts
// Valida o JWT no servidor e retorna o usuário autenticado.
// Redireciona para /sign-in se a sessão for inválida.
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function getAuthUser() {
  const supabase = createSupabaseServerClient();
  // getUser() valida o token no servidor — mais seguro que getSession()
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect('/sign-in');

  return user;
}
```
```typescript
// lib/auth/get-membership.ts
// Retorna o membership ativo do usuário (organization_id + role).
// Usado em todos os Server Actions como ponto único de autenticação + autorização.
import { getAuthUser } from './get-user';
import { db } from '@/lib/db';

export async function getActiveMembership() {
  const user = await getAuthUser();

  const membership = await db.query.organizationMembers.findFirst({
    where: (m, { eq }) => eq(m.userId, user.id),
    with: { organization: true },
  });

  if (!membership) {
    // Usuário autenticado mas sem org → forçar onboarding
    throw new Error('NO_ORGANIZATION');
  }

  return {
    user,
    membership,
    organizationId: membership.organizationId,
    role: membership.role,
  };
}
```
---
MIDDLEWARE
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up', '/reset-password', '/auth'];
const isPublic       = (p: string) => PUBLIC_ROUTES.some(r => p.startsWith(r));
const isProposal     = (p: string) => p.startsWith('/p/');   // propostas públicas por token

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name)              { return request.cookies.get(name)?.value; },
        set(name, value, opts) {
          request.cookies.set({ name, value, ...opts });
          response.cookies.set({ name, value, ...opts });
        },
        remove(name, opts) {
          request.cookies.set({ name, value: '', ...opts });
          response.cookies.set({ name, value: '', ...opts });
        },
      },
    }
  );

  // IMPORTANTE: getUser() — valida JWT no servidor (não apenas o cookie)
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Propostas públicas: sempre acessível sem login
  if (isProposal(path)) return response;

  // Rotas públicas: redireciona usuário logado para o app
  if (isPublic(path)) {
    if (user) return NextResponse.redirect(new URL('/app/pipeline', request.url));
    return response;
  }

  // Rotas protegidas: redireciona usuário não logado para sign-in
  if (!user) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```
---
PÁGINAS DE AUTENTICAÇÃO
```typescript
// app/(auth)/sign-up/page.tsx
'use client';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  name:     z.string().min(2, 'Nome obrigatório'),
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export default function SignUpPage() {
  const supabase  = createSupabaseBrowserClient();
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: any) {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.name },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    if (error) setError(error.message);
    else setEmailSent(true);
    setLoading(false);
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    });
  }

  if (emailSent) return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md text-center p-8">
        <p className="text-lg font-semibold">Confirme seu e-mail ✉️</p>
        <p className="text-sm text-gray-500 mt-2">
          Enviamos um link de acesso. Verifique sua caixa de entrada.
        </p>
      </Card>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Criar sua conta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
            Continuar com Google
          </Button>
          <div className="relative flex justify-center text-xs uppercase text-gray-400">
            <span className="bg-white px-2">ou</span>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message as string}</p>}
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message as string}</p>}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Criando...' : 'Criar conta'}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500">
            Já tem conta? <a href="/sign-in" className="underline text-primary">Entrar</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```
```typescript
// app/(auth)/sign-in/page.tsx
'use client';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInPage() {
  const supabase = createSupabaseBrowserClient();
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  async function onSubmit(data: any) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) setError('E-mail ou senha inválidos.');
    else window.location.href = '/app/pipeline';
    setLoading(false);
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Entrar no CloseCRM</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
            Continuar com Google
          </Button>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div><Label>E-mail</Label><Input type="email" {...register('email')} /></div>
            <div><Label>Senha</Label><Input type="password" {...register('password')} /></div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="flex justify-between text-sm text-gray-500">
            <a href="/reset-password" className="underline">Esqueci a senha</a>
            <a href="/sign-up" className="underline">Criar conta</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```
```typescript
// app/auth/confirm/page.tsx
// Callback chamado após OAuth ou confirmação de e-mail.
// Redireciona para onboarding se não tiver org, ou para o pipeline se já tiver.
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export default async function AuthConfirmPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const membership = await db.query.organizationMembers.findFirst({
    where: (m, { eq }) => eq(m.userId, user.id),
  });

  redirect(membership ? '/app/pipeline' : '/onboarding');
}
```
---
ONBOARDING — CRIAÇÃO DE ORGANIZAÇÃO
```typescript
// app/(onboarding)/onboarding/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createOrganization } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function OnboardingPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Crie seu workspace</h1>
          <p className="text-gray-500 text-sm mt-1">
            Seu workspace é o ambiente isolado da sua equipe comercial.
          </p>
        </div>
        <form action={createOrganization} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da empresa ou equipe</Label>
            <Input id="name" name="name" placeholder="Ex: Imobiliária Central" required />
          </div>
          <Button type="submit" className="w-full">
            Criar workspace e começar
          </Button>
        </form>
      </div>
    </div>
  );
}
```
```typescript
// lib/actions/organizations.ts
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { organizations, organizationMembers } from '@/lib/db/schema';
import { redirect } from 'next/navigation';

export async function createOrganization(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const name = (formData.get('name') as string)?.trim();
  if (!name || name.length < 2) throw new Error('Nome inválido');

  // Gera slug a partir do nome
  const slug = name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Cria organização e insere o criador como admin
  const [org] = await db.insert(organizations)
    .values({ name, slug })
    .returning();

  await db.insert(organizationMembers).values({
    organizationId: org.id,
    userId: user.id,
    role: 'admin',
  });

  redirect('/app/pipeline');
}
```
---
SERVER ACTIONS ATUALIZADOS
Leads
```typescript
// lib/actions/leads.ts
'use server';

import { getActiveMembership } from '@/lib/auth/get-membership';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreateLeadSchema = z.object({
  name:            z.string().min(2, 'Nome obrigatório'),
  phone:           z.string().min(10, 'Telefone inválido'),
  origin:          z.enum(['whatsapp','instagram_facebook','trafego_pago','organico','indicacao','site','outro']),
  productInterest: z.string().optional(),
  observations:    z.string().optional(),
  temperature:     z.enum(['quente','morno','frio']).default('morno'),
  assignedTo:      z.string().uuid().optional(),
});

export async function createLead(data: z.infer<typeof CreateLeadSchema>) {
  // getActiveMembership valida auth e retorna organizationId + role
  const { user, organizationId } = await getActiveMembership();
  const validated = CreateLeadSchema.parse(data);

  const [lead] = await db.insert(leads).values({
    ...validated,
    organizationId,
    assignedTo: validated.assignedTo ?? user.id,
    status: 'novo',
    lastContactAt: new Date(),
  }).returning();

  revalidatePath('/app/pipeline');
  return { success: true, lead };
}

export async function updateLeadStatus(
  leadId: string,
  status: typeof leads.$inferSelect['status'],
  lossReason?: string
) {
  const { organizationId } = await getActiveMembership();

  await db.update(leads)
    .set({
      status,
      lossReason: status === 'perdido' ? lossReason : undefined,
      closedAt:   status === 'fechado'  ? new Date()  : undefined,
      updatedAt:  new Date(),
    })
    .where(and(
      eq(leads.id, leadId),
      eq(leads.organizationId, organizationId),
    ));

  revalidatePath('/app/pipeline');
  return { success: true };
}

export async function getLeadsByOrg() {
  const { organizationId } = await getActiveMembership();

  return db.query.leads.findMany({
    where: (l, { eq, and, isNull }) => and(
      eq(l.organizationId, organizationId),
      isNull(l.deletedAt)
    ),
    orderBy: (l, { desc }) => [desc(l.createdAt)],
  });
}
```
Histórico
```typescript
// lib/actions/history.ts
'use server';

import { getActiveMembership } from '@/lib/auth/get-membership';
import { db } from '@/lib/db';
import { leadHistory, leads } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const AddHistorySchema = z.object({
  leadId:       z.string().uuid(),
  contactType:  z.enum(['whatsapp','ligacao','email','visita','outro']),
  summary:      z.string().min(5, 'Descreva o que foi conversado'),
  objections:   z.string().optional(),
  realInterest: z.string().optional(),
  nextStep:     z.string().optional(),
  nextStepDate: z.date().optional(),
});

export async function addLeadHistory(data: z.infer<typeof AddHistorySchema>) {
  const { user, organizationId } = await getActiveMembership();
  const validated = AddHistorySchema.parse(data);

  await db.insert(leadHistory).values({
    ...validated,
    organizationId,
    createdBy: user.id,
  });

  await db.update(leads).set({
    lastContactAt:  new Date(),
    nextFollowupAt: validated.nextStepDate ?? null,
    updatedAt:      new Date(),
  }).where(and(
    eq(leads.id, validated.leadId),
    eq(leads.organizationId, organizationId),
  ));

  revalidatePath('/app/pipeline');
  return { success: true };
}
```
Follow-up
```typescript
// lib/actions/followup.ts
'use server';

import { getActiveMembership } from '@/lib/auth/get-membership';
import { db } from '@/lib/db';

export async function getFollowupLeads() {
  const { organizationId } = await getActiveMembership();

  const now           = new Date();
  const threeDaysAgo  = new Date(now.getTime() - 3  * 86_400_000);
  const fifteenAgo    = new Date(now.getTime() - 15 * 86_400_000);

  const active = ['novo','em_atendimento','aguardando_resposta',
                  'documentacao_analise','agendamento_visita'] as const;

  const all = await db.query.leads.findMany({
    where: (l, { eq, isNull }) => eq(l.organizationId, organizationId),
  });

  return {
    urgent:       all.filter(l => active.includes(l.status as any)
                              && l.nextFollowupAt && l.nextFollowupAt <= now),
    stopped:      all.filter(l => active.includes(l.status as any)
                              && (!l.lastContactAt || l.lastContactAt <= threeDaysAgo)),
    retomada:     all.filter(l => (l.status === 'perdido' || l.temperature === 'frio')
                              && l.lastContactAt && l.lastContactAt <= fifteenAgo),
    almostClosing: all.filter(l => l.temperature === 'quente'
                              && ['agendamento_visita','documentacao_analise'].includes(l.status)),
  };
}
```
Convite de Membros
```typescript
// app/api/invites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { email, role = 'member' } = await req.json();

  const membership = await db.query.organizationMembers.findFirst({
    where: (m, { eq }) => eq(m.userId, user.id),
  });

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admins podem convidar membros' }, { status: 403 });
  }

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { organization_id: membership.organizationId, invited_role: role },
    redirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/confirm`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
```
---
SEGURANÇA — POR QUE auth.uid() É SUPERIOR
Aspecto	`current_setting('app.org_id')` (era Clerk)	`auth.uid()` (Supabase nativo)
Fonte da verdade	Configurado pela aplicação — manipulável	JWT assinado pelo Supabase — imutável
Complexidade	Requer set manual em cada request	Automático em toda sessão autenticada
Risco de vazamento	Uma query sem o set expõe dados de outra org	Impossível: RLS valida no próprio banco
Multi-tenant	Necessita helper externo	Subquery na `organization_members`
Padrão canônico de policy (replicado em todas as tabelas)
```sql
CREATE POLICY "Membros acessam dados da sua org"
  ON [tabela] FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```
Checklist de segurança
✅ RLS habilitado em todas as 8 tabelas  
✅ Todas as policies usam `auth.uid()` — zero dependência externa  
✅ `getActiveMembership()` valida auth antes de qualquer Server Action  
✅ `supabaseAdmin` (service_role) usado apenas em Route Handlers server-side  
✅ Middleware usa `getUser()` (valida JWT), não `getSession()` (apenas cookie)  
✅ Token público de proposta é o único ponto de acesso anônimo — escopo mínimo  
✅ Nenhuma variável `CLERK_*` em nenhum ambiente
---
VARIÁVEIS DE AMBIENTE
.env.local — lista final (sem nenhuma variável do Clerk)
```bash
# ── Supabase ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Connection string para o Drizzle ORM (transaction mode pooler do Supabase)
DATABASE_URL=postgresql://postgres.[project-id]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres

# ── Resend ─────────────────────────────────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# ── App ────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_URL=http://localhost:3000
```
Em produção (Vercel → Settings → Environment Variables)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres.[project-id]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
RESEND_API_KEY=re_...
NEXT_PUBLIC_URL=https://closecrm.app
```
> ⚠️ Busque por `CLERK` em todo o projeto antes de fazer deploy. Nenhuma variável Clerk deve existir.
---
PASSO A PASSO — MIGRAÇÃO E SETUP
Pré-requisitos
Node.js 18+
Conta Supabase, Vercel e GitHub
Projeto Next.js existente (ou novo)
---
Passo 1 — Remover Clerk
```bash
npm uninstall @clerk/nextjs @clerk/backend svix

# Verificar se ficou algum import residual
grep -r "@clerk" app/ lib/ middleware.ts --include="*.ts" --include="*.tsx" -l
```
Cada arquivo listado deve ser editado ou deletado conforme a lista de arquivos acima.
---
Passo 2 — Instalar Supabase SSR
```bash
npm install @supabase/supabase-js @supabase/ssr
```
---
Passo 3 — Criar projeto no Supabase
supabase.com → New Project → região South America (São Paulo)
`Settings → API` → copiar Project URL e anon key
`Settings → API` → copiar service_role key (guardar segura, nunca expor no cliente)
`Settings → Database → Connection String → Transaction mode` → copiar para `DATABASE_URL`
---
Passo 4 — Configurar Auth no Supabase
```
Authentication → Providers
  → Email: habilitado (padrão)
  → Google: habilitar com Client ID e Client Secret (Google Cloud Console)
     Callback URL a adicionar no Google: https://[project-id].supabase.co/auth/v1/callback

Authentication → URL Configuration
  → Site URL:     http://localhost:3000
  → Redirect URLs: http://localhost:3000/auth/confirm
```
---
Passo 5 — Rodar migrations SQL no Supabase
Acessar `Supabase Dashboard → SQL Editor` e rodar cada script em ordem:
```
001_enums.sql
002_profiles.sql       ← inclui trigger on_auth_user_created
003_organizations.sql
004_organization_members.sql
005_leads.sql
006_lead_history.sql
007_proposals.sql
008_automations.sql
```
Verificar em `Table Editor` que todas as tabelas foram criadas corretamente.
---
Passo 6 — Configurar Drizzle
```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';
export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
} satisfies Config;
```
```bash
npx drizzle-kit generate:pg
```
---
Passo 7 — Verificar arquivos criados
```bash
# Devem existir:
ls lib/supabase/server.ts
ls lib/supabase/client.ts
ls lib/supabase/admin.ts
ls lib/auth/get-user.ts
ls lib/auth/get-membership.ts
ls middleware.ts
ls app/\(auth\)/sign-in/page.tsx
ls app/\(auth\)/sign-up/page.tsx
ls app/auth/confirm/page.tsx
ls app/\(onboarding\)/onboarding/page.tsx
ls lib/actions/organizations.ts
ls app/api/invites/route.ts

# NÃO devem existir:
ls app/api/webhooks/clerk/   # deve dar erro
```
---
Passo 8 — Rodar em desenvolvimento
```bash
cp .env.example .env.local
# Preencher com os valores do Supabase + Resend

npm run dev
```
Fluxo de teste manual:
`http://localhost:3000/sign-up` → criar conta
Confirmar e-mail (ou desativar confirmação no Supabase para dev)
Redirecionado para `/onboarding` → criar workspace
Redirecionado para `/app/pipeline`
Criar o primeiro lead → confirmar que aparece no Kanban
Abrir o lead → registrar atendimento no histórico
Acessar `/app/followup` → verificar agrupamentos
---
Passo 9 — Deploy no Vercel
```bash
npx vercel   # ou conectar via GitHub no dashboard do Vercel
```
Adicionar todas as variáveis em `Vercel → Settings → Environment Variables`.
Atualizar no Supabase para produção:
```
Authentication → URL Configuration
  → Site URL:     https://closecrm.app
  → Redirect URLs: https://closecrm.app/auth/confirm
```
---
ESTRUTURA DE PASTAS FINAL
```
/app
  /(auth)
    /sign-in/page.tsx
    /sign-up/page.tsx
    /reset-password/page.tsx
  /auth
    /confirm/page.tsx             ← callback OAuth + confirmação e-mail
  /(onboarding)
    /onboarding/page.tsx
  /(app)
    /layout.tsx
    /dashboard/page.tsx
    /pipeline/page.tsx
    /leads/page.tsx
    /leads/[id]/page.tsx
    /followup/page.tsx
    /proposals/page.tsx
    /automations/page.tsx
    /reports/page.tsx
    /settings/page.tsx
  /p
    /[token]/page.tsx             ← proposta pública (sem auth)
  /api
    /invites/route.ts
/components
  /pipeline
  /leads
  /followup
  /dashboard
  /ui
/lib
  /supabase
    server.ts
    client.ts
    admin.ts
  /auth
    get-user.ts
    get-membership.ts
  /db
    index.ts
    schema.ts
  /actions
    leads.ts
    history.ts
    followup.ts
    organizations.ts
    email.ts
    proposals.ts
/emails
  welcome.tsx
  followup-digest.tsx
  invite-member.tsx
  proposal-viewed.tsx
middleware.ts
drizzle.config.ts
```
---
ROADMAP TÉCNICO
Fase 1 — Infraestrutura e Auth (Semana 1)
Setup Supabase Auth (e-mail + Google OAuth)
Migrations SQL completas (8 scripts)
Middleware, helpers de auth, clientes Supabase SSR
Páginas sign-in, sign-up, confirm, onboarding
Fase 2 — Core CRM (Semana 2)
CRUD completo de leads
Pipeline Kanban com drag-and-drop (@dnd-kit)
Histórico de atendimento
Painel de follow-up com agrupamentos automáticos
Fase 3 — Funcionalidades Avançadas (Semana 3–4)
Dashboard com métricas e gráficos (Recharts)
Propostas digitais (editor + link público + aceite + PDF)
Automações de e-mail (Resend + triggers por evento)
Convite de membros via `supabaseAdmin.auth.admin.inviteUserByEmail`
Fase 4 — Relatórios e Lançamento (Semana 5+)
Relatórios exportáveis em CSV/Excel e PDF
Agendamento de relatórios por e-mail
Testes de RLS (queries diretas via SQL Editor para validar isolamento)
Monitoramento com Sentry + Vercel Analytics
Configuração de produção no Vercel