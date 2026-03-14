PRD - CloseCRM
1. VISÃO DO PRODUTO
CloseCRM é uma plataforma de gestão comercial focada em times de vendas que operam via WhatsApp, anúncios e indicações. O produto organiza todo o ciclo de atendimento — da entrada do lead ao fechamento — com pipeline visual, histórico de conversas e alertas de follow-up inteligentes. O objetivo central é transformar atendimentos informais em um processo comercial estruturado e rastreável.
---
2. OBJETIVOS DE NEGÓCIO
Reduzir em 80% a perda de leads por falta de acompanhamento ou esquecimento
Aumentar a taxa de conversão ao organizar e priorizar atendimentos ativos
Dar visibilidade completa ao funil de vendas para que gestores e vendedores tomem decisões com dados reais
Reduzir o tempo médio de resposta ao lead com alertas de follow-up e identificação de leads parados
Criar histórico comercial rastreável por cliente, por vendedor e por origem
---
3. PERSONAS
Lucas — Corretor de Imóveis Autônomo
Atende 30–60 leads por mês vindos do Instagram, WhatsApp e portais
Usa o celular como principal ferramenta de trabalho
Perde leads por não ter controle de quem respondeu e quem não respondeu
Necessidade principal: saber exatamente quem precisa de retorno hoje e qual é o próximo passo com cada lead
Fernanda — Gerente Comercial de Imobiliária
Lidera uma equipe de 5 a 12 corretores
Precisa acompanhar a performance do time sem depender de planilhas ou relatórios manuais
Quer entender quais canais geram mais vendas e onde o funil está travado
Necessidade principal: painel de acompanhamento do time e visibilidade sobre conversão por origem e etapa
Rafael — Vendedor de Produtos de Alto Ticket (Seguros, Consultoria, Serviços B2C)
Atende leads quentes vindos de tráfego pago e indicações
Precisa registrar objeções, preferências e histórico para não repetir abordagens erradas
Necessidade principal: área de anotações estratégicas e qualificação de leads para priorizar energia nos leads certos
---
4. FUNCIONALIDADES CORE
4.1 Autenticação (Supabase Auth)
Login com e-mail e senha
Login com Google via OAuth (Supabase Auth Provider)
Recuperação de senha por e-mail
Sessão persistente gerenciada pelo Supabase (JWT + refresh token automático)
Convite de membros por e-mail com papéis: Admin e Membro
Multi-tenancy nativo via tabela `organization_members` no banco
---
4.2 Cadastro de Leads e Clientes
Descrição:
Cada lead é uma entidade central do sistema, com campos comercialmente relevantes e status de atendimento. O cadastro deve ser rápido e funcional no mobile.
Requisitos:
Campos obrigatórios: nome, telefone, origem, status
Campos opcionais: produto/imóvel de interesse, observações gerais
Telefone com máscara e link direto para abrir conversa no WhatsApp Web
Origem do lead com opções pré-definidas: WhatsApp, Instagram/Facebook, Tráfego Pago, Orgânico, Indicação, Site, Outro
Status do atendimento alinhado com o pipeline: Lead Novo, Em Atendimento, Aguardando Resposta, Documentação/Análise, Agendamento/Visita, Fechado, Perdido
Temperatura do lead (qualificação): Quente 🔥, Morno 🌡️, Frio ❄️
Responsável pelo atendimento (vendedor atribuído)
Data de entrada automática
Fluxo do usuário:
Vendedor clica em "Novo Lead" na barra superior ou no pipeline
Preenche o formulário com nome, telefone, origem e produto de interesse
Define o status inicial (padrão: Lead Novo) e temperatura
Salva — lead aparece automaticamente no pipeline na coluna correta
Sistema registra data/hora de criação e vendedor responsável
---
4.3 Pipeline de Vendas (Kanban)
Descrição:
Visualização em colunas do tipo Kanban representando cada etapa do funil comercial. Permite arrastar e soltar leads entre etapas e ter visão rápida do estado de cada atendimento.
Requisitos:
Colunas fixas: Lead Novo → Em Atendimento → Aguardando Resposta → Documentação/Análise → Agendamento/Visita → Fechado → Perdido
Cards de lead exibem: nome, telefone (com botão WhatsApp), temperatura, data do último contato e responsável
Drag and drop para mover entre etapas (atualiza status automaticamente)
Contador de leads por coluna
Filtros: por responsável, por origem, por temperatura, por período
Indicação visual de leads parados: card destacado em amarelo se sem contato há mais de 2 dias, vermelho se mais de 5 dias
Clique no card abre painel lateral com detalhes completos do lead
Fluxo do usuário:
Vendedor acessa o pipeline e vê todos os seus leads organizados por etapa
Após contato com um lead, arrasta o card para a etapa correta
Sistema registra automaticamente a mudança de etapa com data/hora no histórico
Cards com indicador vermelho sinalizam prioridade de follow-up
---
4.4 Histórico de Atendimento
Descrição:
Registro cronológico de todas as interações com o lead. Funciona como um diário comercial — cada entrada documenta o que foi dito, o que foi identificado e qual é o próximo passo acordado.
Requisitos:
Cada entrada do histórico contém: data/hora, texto livre da conversa, objeções identificadas, interesse real observado e próximo passo definido
Campo de próximo passo com data agendada (gera alerta de follow-up)
Exibição cronológica, da entrada mais recente para a mais antiga
Última entrada destacada no card do pipeline
Tipo de contato: WhatsApp, Ligação, E-mail, Visita, Outro
Vendedor que registrou a entrada
Fluxo do usuário:
Vendedor abre o lead no painel lateral
Clica em "Registrar Atendimento"
Preenche o que foi conversado, objeções e próximo passo (com data)
Salva — entrada aparece no topo do histórico
Se o próximo passo tiver data, gera um alerta automático de follow-up
---
4.5 Gestão de Follow-up
Descrição:
Painel dedicado a ajudar o vendedor a não deixar nenhum lead sem atenção. Agrupa leads por urgência de resposta com base em regras automáticas.
Requisitos:
Seção "Responder Hoje": leads com próximo passo com data de hoje ou vencida
Seção "Parados": leads sem registro de atendimento há mais de 3 dias
Seção "Retomada": leads marcados como perdidos ou frios com mais de 15 dias sem contato (candidatos a mensagem de retomada)
Seção "Quase Fechando": leads com temperatura Quente na etapa Agendamento/Visita ou Documentação/Análise
Botão de link direto para WhatsApp em cada card
Marcar follow-up como feito sem precisar abrir o lead (registra contato rápido)
Fluxo do usuário:
Vendedor acessa a seção de Follow-up no início do dia
Visualiza leads agrupados por urgência
Clica no link do WhatsApp para iniciar conversa diretamente
Marca como atendido ou registra uma nota rápida
Lead sai do grupo de alerta após o contato
---
4.6 Qualificação de Leads
Descrição:
Sistema de temperatura e pontuação para ajudar o vendedor a priorizar energia nos leads com maior probabilidade de fechamento.
Requisitos:
Temperatura manual: Quente 🔥, Morno 🌡️, Frio ❄️ (definida pelo vendedor)
Campos de qualificação nas anotações estratégicas: renda/capacidade financeira, disponibilidade, tipo de produto buscado, nível de urgência
Filtro no pipeline por temperatura
Indicação visual no card (badge colorido)
Campo "Motivo de não fechamento" obrigatório ao mover para "Perdido"
Fluxo do usuário:
Após o primeiro contato, vendedor define a temperatura do lead
Preenche campos de qualificação conforme avança no atendimento
Leads Quentes aparecem destacados no pipeline e no follow-up
Ao perder o lead, registra o motivo para análise posterior
---
4.7 Anotações Estratégicas
Descrição:
Área de texto rico dentro de cada lead para registrar informações contextuais que não cabem no histórico formal de atendimento.
Requisitos:
Campo de texto livre (sem formatação complexa — texto simples com quebras de linha)
Campos estruturados complementares: renda estimada, disponibilidade de entrada, produto/imóvel específico de interesse, dúvidas recorrentes, motivo de objeção principal
Visível no painel lateral do lead
Editável a qualquer momento com registro de última edição
Fluxo do usuário:
Vendedor acessa o lead
Vai para a aba "Anotações"
Preenche e atualiza livremente conforme o atendimento evolui
Informações ficam disponíveis para qualquer vendedor com acesso ao lead
---
4.8 Painel de Acompanhamento (Dashboard)
Descrição:
Visão executiva do funil com métricas em tempo real para gestores e vendedores acompanharem desempenho.
Requisitos:
Cards de resumo: Total de Leads, Em Atendimento, Parados (>3 dias), Fechados no período, Perdidos no período
Gráfico de funil: quantidade de leads por etapa do pipeline
Gráfico de origens: distribuição de leads por canal (pizza ou barras)
Taxa de conversão: leads fechados / total de leads no período
Tabela de performance por vendedor: leads ativos, fechados, taxa de conversão
Filtro por período: hoje, últimos 7 dias, últimos 30 dias, mês atual, personalizado
Gráfico de tendência: leads novos por semana/mês
Fluxo do usuário:
Gestor acessa o Dashboard
Define o período de análise
Visualiza métricas consolidadas do time
Identifica gargalos no funil (etapas com acúmulo ou baixa conversão)
Compara performance entre vendedores e origens
---
4.9 Análise de Origens e Canais
Descrição:
Relatório comparativo de desempenho por canal de aquisição, mostrando não só quantidade mas qualidade dos leads gerados.
Requisitos:
Por origem: total de leads, taxa de resposta (teve atendimento), taxa de visita/agendamento, taxa de fechamento
Comparativo entre períodos
Destaque para a origem com maior taxa de conversão
Filtro por vendedor e período
---
4.10 Automações de E-mail
Descrição:
Motor de automações que dispara e-mails transacionais e de relacionamento com base em eventos e condições do funil — sem necessidade de ação manual do vendedor. Substitui lembretes esquecidos e garante que nenhum lead fique sem comunicação nos momentos críticos do processo comercial.
Requisitos:
Gatilhos de disparo configuráveis:
Lead entra em uma etapa específica do pipeline (ex: ao mover para "Aguardando Resposta")
Lead fica X dias sem contato (ex: 3 dias sem atendimento → dispara e-mail de retomada)
Próximo passo vence sem atualização (ex: follow-up não realizado)
Lead é marcado como Quente pelo vendedor
Lead é movido para "Fechado" (disparo de e-mail de boas-vindas ao cliente)
Templates de e-mail editáveis por organização: assunto, corpo em texto rico, personalização com variáveis ({nome}, {produto}, {vendedor})
Biblioteca de templates prontos: retomada de lead frio, confirmação de agendamento, boas-vindas pós-fechamento, lembrete de documentação pendente
Ativação/desativação de cada automação individualmente
Histórico de disparos por lead (data, template enviado, status de entrega)
Controle de frequência: mesmo lead não recebe o mesmo template mais de uma vez por período configurável (padrão: 7 dias)
Fluxo do usuário:
Admin acessa "Automações" nas configurações da organização
Cria uma nova automação escolhendo gatilho, condição e template
Ativa a automação — ela passa a monitorar os leads da org em tempo real
Quando a condição é atendida, o e-mail é disparado automaticamente via Resend
Vendedor consulta o histórico do lead e vê os e-mails enviados automaticamente
---
4.11 Propostas Digitais
Descrição:
Ferramenta para criação, envio e rastreamento de propostas comerciais diretamente dentro do CRM. Cada proposta fica vinculada ao lead, com controle de status (enviada, visualizada, aceita, recusada) e histórico completo de versões.
Requisitos:
Editor de proposta simples: título, itens (descrição + valor), condições de pagamento, validade, observações e logo da empresa
Campos pré-preenchidos automaticamente com dados do lead (nome, produto de interesse)
Geração de link público único para visualização da proposta pelo cliente (sem necessidade de login)
Status rastreável: Rascunho → Enviada → Visualizada → Aceita / Recusada
Notificação ao vendedor quando o cliente abre a proposta (via e-mail e alerta no painel)
Múltiplas versões por lead (v1, v2, v3…) com histórico preservado
Aceite digital: cliente clica em "Aceitar Proposta" no link público, registra nome e data/hora
Ao aceitar, status do lead muda automaticamente para "Fechado" no pipeline
Exportação da proposta em PDF para envio manual se necessário
Fluxo do usuário:
Vendedor abre o lead e clica em "Nova Proposta"
Preenche os itens, valores, condições e validade
Clica em "Enviar" — sistema gera link público e dispara e-mail para o lead
Vendedor recebe notificação assim que o cliente abre o link
Cliente aceita ou recusa diretamente na página da proposta
Status da proposta e do lead são atualizados automaticamente no CRM
---
4.12 Relatórios e Exportações
Descrição:
Módulo de relatórios operacionais e exportação de dados para uso externo — planilhas, apresentações e prestação de contas. Complementa o Dashboard com visões mais detalhadas e permite extrair os dados do CRM para outros contextos.
Requisitos:
Exportação de leads em CSV/Excel com todos os campos: nome, telefone, origem, status, temperatura, responsável, datas, observações
Filtros de exportação: por período, status, responsável, temperatura e origem
Relatório de conversão por etapa: quantos leads entraram e saíram de cada etapa no período, com taxa de avanço
Relatório de performance por vendedor: total de leads, atendidos, fechados, perdidos e taxa de conversão — exportável em PDF
Relatório de origem: volume e taxa de conversão por canal de aquisição — exportável em PDF
Relatório de propostas: enviadas, visualizadas, aceitas e recusadas no período
Agendamento de relatórios: envio automático por e-mail semanal ou mensal para o gestor (PDF em anexo)
Exportação do histórico de atendimentos de um lead específico em PDF (útil para transferência de carteira ou auditoria)
Fluxo do usuário:
Gestor acessa "Relatórios" no menu lateral
Escolhe o tipo de relatório e define os filtros de período e segmento
Visualiza o relatório na tela antes de exportar
Clica em "Exportar PDF" ou "Exportar Excel" — arquivo é gerado e baixado imediatamente
Para relatórios recorrentes, configura o agendamento com e-mail de destino e frequência
---
5. REQUISITOS NÃO-FUNCIONAIS
Performance: Carregamento do pipeline < 2s com até 500 leads ativos; dashboard < 3s
Segurança: Isolamento total entre organizações via RLS no Supabase; nenhuma query sem filtro de org_id
Escalabilidade: Suporte a até 10.000 leads por organização sem degradação de performance
Responsividade: Totalmente funcional em mobile (375px+), tablet e desktop — vendedores usam principalmente celular
Offline parcial: Leitura de leads em cache no mobile (via PWA progressivo — fora do escopo V1)
Disponibilidade: SLA de 99,5% via Vercel + Supabase
---
6. FORA DO ESCOPO V1
❌ Integração direta com WhatsApp Business API (envio de mensagens pelo CRM)
❌ App mobile nativo (iOS/Android)
❌ Integração com portais imobiliários (ZAP, VivaReal)
❌ Assinatura eletrônica
❌ Chatbot ou IA para triagem automática de leads
❌ Integrações com ERPs ou sistemas financeiros
---
7. ONBOARDING
Fluxo:
Usuário acessa o site e clica em "Começar Grátis"
Cadastro via Supabase Auth (e-mail/senha ou Google OAuth)
Confirmação de e-mail (link enviado pelo Supabase)
Após confirmar, usuário é redirecionado para o onboarding de criação da organização
Preenche nome da empresa — registro criado nas tabelas `organizations` e `organization_members`
Tela de boas-vindas com checklist de primeiros passos
Convite para membros da equipe por e-mail (opcional, pode pular)
Cadastro do primeiro lead (guiado com tooltips)
Redirecionamento para o Pipeline com o lead criado visível
Checklist de Primeiros Passos:
[ ] Criar sua conta e workspace
[ ] Cadastrar o primeiro lead
[ ] Definir a origem e temperatura do lead
[ ] Registrar o primeiro atendimento no histórico
[ ] Convidar um membro da equipe
[ ] Explorar o painel de follow-up
---
8. MÉTRICAS DE SUCESSO
Ativação: 70% dos usuários cadastram pelo menos 5 leads na primeira semana
Retenção D30: 60% dos usuários ativos retornam em 30 dias
Engajamento: Média de 3+ registros de atendimento por lead fechado
Adoção do Pipeline: 80% dos leads criados têm mudança de etapa registrada
Conversão de plano: 15% dos usuários free convertem para plano pago em 30 dias
NPS: ≥ 40 após 60 dias de uso