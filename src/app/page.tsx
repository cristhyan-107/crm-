import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, LayoutDashboard, MessageSquareText, TrendingUp, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden">
      {/* Navbar Minimalista */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/60 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">CloseCRM</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#recursos" className="hover:text-white transition-colors">Recursos</Link>
            <Link href="#beneficios" className="hover:text-white transition-colors">Benefícios</Link>
            <Link href="#preview" className="hover:text-white transition-colors">Plataforma</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-muted-foreground hover:text-white">Entrar</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
          </div>

          <div className="container mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-muted-foreground mb-8">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Gestão comercial para a era do WhatsApp
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight mb-8">
              Venda mais.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                Perca zero leads.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              Organize seus atendimentos, automatize seus follow-ups e feche mais negócios. O CRM perfeito para corretores e vendedores de alto ticket.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-14 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  Criar conta gratuita
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="#preview">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/10 hover:bg-white/5 bg-transparent">
                  Ver como funciona
                </Button>
              </Link>
            </div>
            <div className="mt-12 text-sm text-muted-foreground flex justify-center items-center gap-6">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Setup em 2 min</span>
            </div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section id="preview" className="py-12 relative z-20">
          <div className="container mx-auto px-6">
            <div className="rounded-2xl border border-white/10 bg-background/50 backdrop-blur-xl p-2 md:p-4 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10 pointer-events-none" />
              
              {/* Fake Browser Window */}
              <div className="rounded-xl overflow-hidden border border-white/5 bg-[#0A0A0A]">
                <div className="h-12 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="ml-4 w-64 h-6 bg-white/5 rounded-md flex items-center justify-center">
                    <div className="text-[10px] text-white/30 font-mono">app.closecrm.com.br</div>
                  </div>
                </div>
                {/* Visual Mockup Content */}
                <div className="p-6 md:p-8 grid md:grid-cols-4 gap-6 relative">
                  {/* Fake Sidebar */}
                  <div className="hidden md:flex flex-col gap-4 border-r border-white/5 pr-6 w-full">
                    <div className="h-8 w-24 bg-white/10 rounded" />
                    <div className="h-4 w-full bg-primary/20 rounded mt-8" />
                    <div className="h-4 w-3/4 bg-white/5 rounded" />
                    <div className="h-4 w-5/6 bg-white/5 rounded" />
                    <div className="h-4 w-2/3 bg-white/5 rounded" />
                  </div>
                  {/* Fake Kanban */}
                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: "Novos", count: 3, color: "bg-blue-500/20 text-blue-400" },
                      { title: "Em Atendimento", count: 5, color: "bg-amber-500/20 text-amber-400" },
                      { title: "Fechamento", count: 2, color: "bg-green-500/20 text-green-400" }
                    ].map((col, i) => (
                      <div key={i} className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-md ${col.color} font-medium`}>{col.title}</span>
                          <span className="text-xs text-muted-foreground">{col.count}</span>
                        </div>
                        {[...Array(col.count)].map((_, j) => (
                          <div key={j} className="h-24 bg-white/5 border border-white/5 rounded-lg p-4 flex flex-col justify-between">
                            <div className="h-3 w-1/2 bg-white/20 rounded" />
                            <div className="h-2 w-1/3 bg-white/10 rounded" />
                            <div className="flex justify-between mt-2">
                              <div className="h-4 w-12 bg-white/5 rounded-full" />
                              <div className="h-4 w-4 bg-white/10 rounded-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits/Features */}
        <section id="recursos" className="py-24 md:py-32">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Tudo que você precisa para dominar suas vendas</h2>
              <p className="text-lg text-muted-foreground">Projetado especificamente para quem atende via WhatsApp, fecha projetos de alto valor e não tem tempo para sistemas complexos.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-white/5 border-white/10 p-8 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                  <LayoutDashboard className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Pipeline Kanban Visual</h3>
                <p className="text-muted-foreground">Arraste e solte seus leads. Saiba exatamente em qual etapa cada negociação está, sem planilhas confusas.</p>
              </Card>

              <Card className="bg-white/5 border-white/10 p-8 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquareText className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Histórico e Follow-ups</h3>
                <p className="text-muted-foreground">Registre cada interação. O sistema te avisa quando um lead esfriar ou quando for hora de retornar o contato.</p>
              </Card>

              <Card className="bg-white/5 border-white/10 p-8 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Dashboard de KPIs</h3>
                <p className="text-muted-foreground">Acompanhe sua taxa de conversão, leads por origem e projeção de receita em tempo real de forma linda e clara.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 border-y border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[128px] rounded-full pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Pronto para acelerar suas vendas?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">Junte-se a corretores e vendedores que organizaram o caos e multiplicaram seus fechamentos.</p>
            <Link href="/sign-up">
              <Button size="lg" className="h-16 px-10 text-lg bg-white text-black hover:bg-white/90 font-semibold rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                Criar conta gratuita agora
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-semibold text-white">CloseCRM</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 CloseCRM. Desenvolvido para vendedores modernos.</p>
        </div>
      </footer>
    </div>
  );
}
