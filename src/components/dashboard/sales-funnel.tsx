'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

const data = [
  { name: 'Novos', value: 400 },
  { name: 'Atendimento', value: 300 },
  { name: 'Visita', value: 200 },
  { name: 'Proposta', value: 100 },
  { name: 'Fechado', value: 50 },
];

export function SalesFunnel() {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm col-span-1 lg:col-span-4 transition-all">
      <CardHeader>
        <CardTitle>Funil de Vendas</CardTitle>
        <CardDescription>Conversão por etapa do funil (últimos 30 dias)</CardDescription>
      </CardHeader>
      <CardContent className="pl-0 pb-4">
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              layout="vertical"
              data={data}
              margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                width={100}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--white)/0.05)' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="value" barSize={32} radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
