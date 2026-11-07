/** API pública de la feature users (empleados, roles y permisos). */
export { CurrentMemberProvider } from './application/CurrentMemberProvider';
export { useCurrentMember, usePermission } from './application/memberContext';
export { useMembers } from './application/useMembers';
export {
  hasPermission,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from './domain/permissions';
export type { Member } from './domain/member';
export { Can } from './ui/Can';
export { EmployeesPanel } from './ui/EmployeesPanel';
export { PendingInvitations } from './ui/PendingInvitations';
