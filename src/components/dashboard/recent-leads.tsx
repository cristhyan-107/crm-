import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const recentLeads = [
  { id: '1', name: 'Carlos Santos', email: 'carlos@exemplo.com', value: 'R$ 250.000', status: 'Novo', date: 'Hoje', origin: 'WhatsApp' },
  { id: '2', name: 'Mariana Lima', email: 'mariana.l@exemplo.com', value: 'R$ 800.000', status: 'Negociação', date: 'Ontem', origin: 'Indicação' },
  { id: '3', name: 'Roberto Almeida', email: 'roberto@almeida.com', value: 'R$ 1.250.000', status: 'Fechado', date: '2 dias atrás', origin: 'Tráfego Pago' },
  { id: '4', name: 'Fernanda Rocha', email: 'fer.rocha@exemplo.com', value: 'R$ 450.000', status: 'Visita', date: '3 dias atrás', origin: 'Instagram' },
  { id: '5', name: 'Lucas Costa', email: 'lcosta@teste.com', value: 'R$ 150.000', status: 'Atendimento', date: '3 dias atrás', origin: 'Site' },
];

export function RecentLeads() {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm lg:col-span-5 transition-all">
      <CardHeader>
        <CardTitle>Oportunidades Recentes</CardTitle>
        <CardDescription>
          Últimos leads que entraram no funil de vendas nesta semana.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>Lead</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Estimado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLeads.map((lead) => (
                <TableRow key={lead.id} className="border-white/5 hover:bg-white/5 border-b">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 rounded-md border border-white/10">
                        <AvatarFallback className="rounded-md bg-primary/20 text-primary text-xs">
                          {lead.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">{lead.name}</span>
                        <span className="text-xs text-muted-foreground mt-1">{lead.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{lead.origin}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-white/10 font-normal bg-white/5">
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{lead.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
