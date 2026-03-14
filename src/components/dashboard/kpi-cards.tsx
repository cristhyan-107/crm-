import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';

export function KpiCards() {
  const kpis = [
    {
      title: 'Total de Leads',
      value: '2.450',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Em Atendimento',
      value: '184',
      change: '+4%',
      trend: 'up',
      icon: Target,
      color: 'text-amber-500',
    },
    {
      title: 'Taxa de Conversão',
      value: '18.2%',
      change: '-2%',
      trend: 'down',
      icon: ArrowUpRight,
      color: 'text-emerald-500',
    },
    {
      title: 'Receita Prevista',
      value: 'R$ 1.2M',
      change: '+24%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-primary',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className={`text-xs flex items-center mt-1 ${kpi.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
              {kpi.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {kpi.change} em relação ao mês passado
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
