import { KpiCards } from '@/components/dashboard/kpi-cards';
import { SalesFunnel } from '@/components/dashboard/sales-funnel';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { LeadsOrigin } from '@/components/dashboard/leads-origin';
import { RecentLeads } from '@/components/dashboard/recent-leads';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Visão Geral</h1>
          <p className="text-muted-foreground">Bem-vindo de volta! Aqui está o resumo das suas vendas.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Ações adicionais do topo do dashboard */}
        </div>
      </div>

      <KpiCards />

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <RevenueChart />
        <LeadsOrigin />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">
        <SalesFunnel />
        <RecentLeads />
      </div>
    </div>
  );
}
