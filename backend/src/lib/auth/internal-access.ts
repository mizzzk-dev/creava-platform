import { verifyAccessToken, type AuthenticatedUser } from './provider'

export type InternalRole =
  | 'super_admin'
  | 'internal_admin'
  | 'support'
  | 'crm'
  | 'moderation'
  | 'campaign'
  | 'read_only'

export type InternalPermission =
  | 'internal.user.read'
  | 'internal.user.update'
  | 'internal.notification.reset'
  | 'internal.account.status.update'
  | 'internal.session.revoke'
  | 'internal.moderation.override'
  | 'internal.campaign.override'
  | 'internal.playbook.run'
  | 'internal.playbook.approve'
  | 'internal.audit.read'
  | 'internal.status.read'
  | 'internal.status.publish'

const ROLE_PERMISSIONS: Record<InternalRole, InternalPermission[]> = {
  super_admin: [
    'internal.user.read',
    'internal.user.update',
    'internal.notification.reset',
    'internal.account.status.update',
    'internal.session.revoke',
    'internal.moderation.override',
    'internal.campaign.override',
    'internal.playbook.run',
    'internal.playbook.approve',
    'internal.audit.read',
    'internal.status.read',
    'internal.status.publish',
  ],
  internal_admin: [
    'internal.user.read',
    'internal.user.update',
    'internal.notification.reset',
    'internal.account.status.update',
    'internal.session.revoke',
    'internal.playbook.run',
    'internal.playbook.approve',
    'internal.audit.read',
    'internal.status.read',
    'internal.status.publish',
  ],
  support: ['internal.user.read', 'internal.notification.reset', 'internal.session.revoke', 'internal.playbook.run', 'internal.audit.read', 'internal.status.read'],
  crm: ['internal.user.read', 'internal.user.update', 'internal.notification.reset', 'internal.playbook.run', 'internal.audit.read', 'internal.status.read'],
  moderation: ['internal.user.read', 'internal.moderation.override', 'internal.audit.read', 'internal.status.read'],
  campaign: ['internal.user.read', 'internal.campaign.override', 'internal.audit.read', 'internal.status.read'],
  read_only: ['internal.user.read', 'internal.audit.read', 'internal.status.read'],
}

function normalizeInternalRoles(rawRoles: unknown): InternalRole[] {
  if (!Array.isArray(rawRoles)) return []
  const roles = rawRoles
    .map((role) => String(role ?? '').trim())
    .filter(Boolean)
    .filter((role): role is InternalRole => role in ROLE_PERMISSIONS)
  return Array.from(new Set(roles))
}

export type InternalAccessContext = {
  authUser: AuthenticatedUser
  internalRoles: InternalRole[]
  permissions: InternalPermission[]
}

export async function requireInternalPermission(ctx: any, permission: InternalPermission): Promise<InternalAccessContext> {
  const authUser = await verifyAccessToken(ctx.request.headers.authorization)
  const internalRoles = normalizeInternalRoles(authUser.claims.roles)
  const permissions = Array.from(new Set(internalRoles.flatMap((role) => ROLE_PERMISSIONS[role] ?? [])))

  if (!permissions.includes(permission)) {
    throw new Error(`Internal permission denied: ${permission}`)
  }

  return { authUser, internalRoles, permissions }
}
