# Soften Performance Hub V2.21.0

## Calendario diario nas telas analiticas

As telas **Meu desempenho**, **Visao do Squad** e **Indicadores** passam a trabalhar com intervalo de datas por dia.

O padrao ao entrar no sistema e:

- data inicial: **primeiro dia do mes atual que possui dados**;
- data final: **ultima data efetivamente importada**;
- se o mes atual ainda nao possui dados, o painel utiliza automaticamente o mes mais recente importado.

Atalhos disponiveis:

- Hoje;
- 7 dias;
- 15 dias;
- Este mes;
- Mes anterior.

## O que responde ao calendario

- atendimentos;
- notas 5;
- total e percentual de avaliacoes;
- nota media;
- evolucao diaria;
- tabela dia a dia;
- ranking operacional do periodo;
- KPIs da Visao do Squad;
- comparativos consolidados entre Squads;
- atendimentos diarios do setor;
- graficos historicos, respeitando somente os dias que fazem parte do intervalo;
- produtividade por hora/minuto nos Indicadores;
- taxa diaria e semanal de avaliacao;
- grafico geral de todos os tecnicos para atendimentos, percentual de avaliacao e nota media.

## O que continua mensal

A competencia mensal continua sendo a fonte oficial de:

- pontuacao;
- status oficial do tecnico;
- ranking oficial mensal;
- metas mensais;
- bonificacao e fechamento financeiro;
- comissao do Admin Geral;
- teto do modelo Individual;
- ferias e snapshots de fechamento.

Nas telas analiticas, quando existe um ranking de periodo, ele e identificado como leitura/simulacao do intervalo e nao altera a pontuacao mensal gravada.

## Banco de dados

Execute uma vez `MIGRACAO_V2.21.0.sql`.

Ela adiciona `notes4`, `notes3`, `notes2` e `notes1` ao historico diario e recria os RPCs agregados necessarios para os filtros diarios.

### Importante apos a migracao

Os registros diarios antigos possuem apenas `att` e `notes5`. Para que filtros parciais de datas calculem corretamente **total de avaliacoes e nota media**, reimporte os meses que deseja analisar por dia. Como o CSV possui as colunas Nota 5 a Nota 1, a V2.21.0 passa a gravar toda a composicao diaria.

A reimportacao continua **substitutiva**, nunca soma com a importacao anterior.

## Publicacao

1. Execute `MIGRACAO_V2.21.0.sql` no Supabase SQL Editor.
2. Publique os arquivos da V2.21.0 no GitHub Pages.
3. Preserve o `config.js` de producao.
4. Faca logout/login e `Ctrl + F5`.
5. Reimporte os meses que deseja usar em analises diarias completas.

Nao e necessario republicar Edge Functions nesta versao.
