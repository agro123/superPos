import { auth } from './auth';
import { business } from './business';
import { catalog } from './catalog';
import { operations } from './operations';
import { platform } from './platform';
import { reports } from './reports';
import { sales } from './sales';
import { settings } from './settings';
import { storefront } from './storefront';
import { terminals } from './terminals';
import { common } from './common';
import { ui } from './ui';
import { users } from './users';

/** Catálogo es-CO. Otro idioma debe implementar `Record<MessageKey, string>`. */
export const messages = {
  ...ui,
  ...common,
  ...auth,
  ...users,
  ...business,
  ...catalog,
  ...sales,
  ...operations,
  ...reports,
  ...settings,
  ...platform,
  ...terminals,
  ...storefront,
} as const;
