# V2.28.1 — Custo geral do Suporte

## Objetivo
Simplificar a tela **Gestão > Custos** para representar o custo global do Suporte técnico, sem cadastro de custo individual por técnico.

## O que mudou
- removida a tabela de valores por técnico da interface;
- novo cadastro único por competência com:
  - custo total com pagamentos;
  - outros custos do Suporte;
  - total de técnicos;
  - horas úteis por dia;
- o sistema sugere automaticamente a quantidade de técnicos encontrada na competência, permitindo ajuste manual;
- os dias úteis são calculados pelo calendário já utilizado no monitor (segunda a sexta-feira);
- a jornada padrão é 8 horas/dia, editável;
- o resumo calcula:
  - custo total do Suporte;
  - dias úteis;
  - capacidade útil total em horas e minutos técnicos;
  - custo médio por dia útil técnico;
  - custo médio por hora técnica;
  - custo médio por minuto técnico.

## Fórmulas
`Custo total = pagamentos + outros custos`

`Capacidade em horas = técnicos × dias úteis × horas úteis/dia`

`Custo por dia útil técnico = custo total ÷ técnicos ÷ dias úteis`

`Custo por hora técnica = custo total ÷ técnicos ÷ dias úteis ÷ horas úteis/dia`

`Custo por minuto técnico = custo por hora técnica ÷ 60`

## Banco de dados
Executar `MIGRACAO_V2.28.1.sql`. A migração cria `support_monthly_costs`. A tabela individual `support_technician_hourly_costs`, criada na V2.28.0, é preservada apenas como legado e não é utilizada pela nova tela.

## Segurança
Os dados continuam disponíveis apenas para **Admin Geral** e não alteram bonificação, metas, pontuação ou indicadores de desempenho.
