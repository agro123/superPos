import {
  ClipboardList,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { stockLevelOf, useProducts } from '@/features/catalog';
import { CashOverview } from '@/features/cash';
import { SetupBanner } from '@/features/setup';
import { usePermission, type Permission } from '@/features/users';
import { startOfDayInZone } from '@/shared/domain/dates';
import { formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t, type MessageKey } from '@/shared/lib/i18n';
import { PageHeader, StatCard } from '@/shared/ui';
import { summarizeSales } from '../domain/salesSummary';
import { useSalesReport } from '../application/useSalesReport';

const ACTIONS: readonly {
  to: string;
  label: MessageKey;
  icon: ReactNode;
  permission: Permission;
}[] = [
  { to: '/pos', label: 'dashboard.sell', icon: <ShoppingCart />, permission: 'sales.create' },
  { to: '/sales', label: 'dashboard.viewSales', icon: <ClipboardList />, permission: 'sales.view' },
  {
    to: '/catalog',
    label: 'dashboard.manageProducts',
    icon: <Package />,
    permission: 'catalog.manage',
  },
  { to: '/cash', label: 'dashboard.openCash', icon: <Wallet />, permission: 'cash.open' },
];

function QuickAction({ to, label, icon, permission }: (typeof ACTIONS)[number]) {
  if (!usePermission(permission)) return null;
  return (
    <li>
      <Link
        to={to}
        className="flex min-h-20 items-center gap-3 rounded-lg border border-border bg-surface p-4 font-medium text-text shadow-sm hover:bg-surface-muted [&_svg]:size-6 [&_svg]:text-primary"
      >
        <span aria-hidden>{icon}</span>
        {t(label)}
      </Link>
    </li>
  );
}

/** Métricas del día (solo con `reports.view`) y accesos rápidos según permisos. */
function Metrics() {
  const { business } = useActiveBusiness();
  const report = useSalesReport(business.id, business.timezone, 7);
  const products = useProducts(business.id);
  const todayStart = startOfDayInZone(new Date(), business.timezone).getTime();
  const yesterdayStart = todayStart - 86_400_000;
  const today = summarizeSales(report.sales.filter((s) => s.occurredAt.getTime() >= todayStart));
  const yesterday = summarizeSales(
    report.sales.filter(
      (s) => s.occurredAt.getTime() >= yesterdayStart && s.occurredAt.getTime() < todayStart,
    ),
  );
  const delta =
    yesterday.total > 0
      ? Math.round(((today.total - yesterday.total) / yesterday.total) * 100)
      : null;
  const low = (products.data ?? []).filter(
    (p) => p.active && ['low', 'out'].includes(stockLevelOf(p)),
  ).length;
  const loading = report.query.isPending;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t('dashboard.salesToday')}
        value={formatMoney(today.total, business.currency)}
        icon={<TrendingUp />}
        loading={loading}
        trend={
          delta === null
            ? undefined
            : {
                label: t('dashboard.vsYesterday', { delta: `${delta > 0 ? '+' : ''}${delta} %` }),
                tone: delta >= 0 ? 'success' : 'warning',
              }
        }
      />
      <StatCard
        label={t('dashboard.ticketsToday')}
        value={formatNumber(today.count)}
        icon={<Receipt />}
        loading={loading}
      />
      <StatCard
        label={t('dashboard.averageTicket')}
        value={formatMoney(report.summary.averageTicket, business.currency)}
        icon={<ClipboardList />}
        loading={loading}
      />
      <StatCard
        label={t('dashboard.lowStock')}
        value={formatNumber(low)}
        icon={<TriangleAlert />}
        loading={products.isPending}
      />
    </div>
  );
}

export default function DashboardPage() {
  const user = useCurrentUser();
  const { business } = useActiveBusiness();
  const canViewReports = usePermission('reports.view');
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={t('dashboard.greeting', { name: user.displayName.split(' ')[0] ?? '' })}
        description={t('dashboard.description', { business: business.name })}
      />
      <SetupBanner />
      {canViewReports ? <Metrics /> : null}
      {canViewReports ? (
        <section aria-labelledby="dashboard-cash" className="flex flex-col gap-3">
          <h2 id="dashboard-cash" className="text-lg font-semibold text-text">
            {t('cash.overview.title')}
          </h2>
          <CashOverview
            businessId={business.id}
            currency={business.currency}
            timezone={business.timezone}
            closedLimit={2}
          />
        </section>
      ) : null}
      <section aria-labelledby="quick-actions" className="flex flex-col gap-3">
        <h2 id="quick-actions" className="text-lg font-semibold text-text">
          {t('dashboard.quickActions')}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ACTIONS.map((action) => (
            <QuickAction key={action.to} {...action} />
          ))}
        </ul>
      </section>
    </div>
  );
}
