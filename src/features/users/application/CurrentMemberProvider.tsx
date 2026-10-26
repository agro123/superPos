import type { ReactNode } from 'react';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import type { Member } from '../domain/member';
import { watchMember } from '../infrastructure/memberRepository';
import { CurrentMemberContext } from './memberContext';

export interface CurrentMemberProviderProps {
  businessId: string;
  uid: string;
  loading: ReactNode;
  renderError: (retry: () => void) => ReactNode;
  /** El usuario no es miembro activo del negocio. */
  renderNotMember: () => ReactNode;
  children: ReactNode;
}

/** Carga en tiempo real la pertenencia del usuario al negocio activo. */
export function CurrentMemberProvider({
  businessId,
  uid,
  loading,
  renderError,
  renderNotMember,
  children,
}: CurrentMemberProviderProps) {
  const member = useLiveQuery(['member', businessId, uid], watchMember(businessId, uid));
  if (member.isError) return renderError(() => void member.refetch());
  if (!member.data) return loading;
  const value: Member | null = member.data.value;
  if (!value)
    return member.data.fromCache ? renderError(() => void member.refetch()) : renderNotMember();
  if (value.status !== 'active') return renderNotMember();
  return <CurrentMemberContext.Provider value={value}>{children}</CurrentMemberContext.Provider>;
}
