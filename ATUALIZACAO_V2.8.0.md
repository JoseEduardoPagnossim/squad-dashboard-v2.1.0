# Atualização V2.8.0

## 1. Status do técnico ficou diário e auditável

O status continua usando 4 critérios:

1. atendimentos;
2. total de avaliações;
3. nota média;
4. % avaliado.

O técnico fica **ACIMA** com pelo menos 2 dos 4 critérios e **ABAIXO** com 0 ou 1.

### Durante o mês aberto

- Se `Referência de atendimentos` foi preenchida manualmente como valor mensal, a referência do dia = `valor mensal × dias úteis transcorridos / dias úteis do mês`.
- O mesmo vale para `Referência de total de avaliações`.
- Nota média e % avaliado são comparados diretamente.
- Campo vazio continua usando a média atual do Squad, já calculada com os dados importados até o momento.

### No fechamento

As referências mensais manuais de volume passam a 100% do valor configurado, a pontuação/status são recalculados e tudo é congelado no snapshot do mês.

## 2. Auditoria visível para o técnico

A tela individual agora mostra:

- Nota média em KPI próprio;
- 4 critérios do status;
- realizado x referência;
- origem da referência;
- quantidade de critérios atendidos;
- avanço de dias úteis considerado.

## 3. Status da equipe igual à planilha

A lógica passa a ser equivalente a:

```text
ACIMA se:
quantidade de técnicos com pontos > média de pontos do grupo
------------------------------------------------------------- >= 50%
quantidade de técnicos válidos

Caso contrário: ABAIXO
```

No sistema não é necessário o `-2` do `CONT.VALORES`, porque só entram na conta os técnicos válidos importados.

## Banco

Nenhuma migração SQL nova é necessária.
