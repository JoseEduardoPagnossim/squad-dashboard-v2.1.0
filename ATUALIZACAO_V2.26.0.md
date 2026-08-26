# Soften Performance Hub V2.26.0

## Objetivo

Adicionar a camada de **Qualidade** aos Indicadores sem alterar a fonte oficial de Serviço, corrigir a visão **Evolução diária dos técnicos** e manter o comportamento financeiro de técnicos que trabalharam apenas parte da competência.

## 1. Novo CSV de Produto/Empresa

A V2.26.0 aceita o CSV no formato atual:

```text
Time
nomeApresentativo
Resolve
NotaServico
NotaProduto
NotaEmpresa
comentario
```

Para a importação de Qualidade, somente estas colunas são obrigatórias:

```text
Time
nomeApresentativo
NotaProduto
NotaEmpresa
```

- **não é necessária coluna de cliente**;
- `Resolve` e `comentario` não participam dos cálculos;
- `NotaServico` é **ignorada completamente** nesta importação;
- Serviço continua tendo como única fonte o CSV operacional já utilizado pelo painel;
- cada linha do CSV de Qualidade é uma avaliação individual;
- antes de gravar, o sistema consolida Produto e Empresa por **técnico + dia + tipo de avaliação**;
- somente notas de 1 a 5 são consideradas. Zero, vazio ou valor inválido significa ausência de avaliação para aquele tipo.

A competência operacional deve existir antes da importação de Qualidade, pois ela fornece o vínculo histórico do técnico com o Squad.

## 2. Armazenamento independente

Nova tabela:

`quality_daily_metrics`

Ela armazena separadamente:

- técnico/competência;
- dia;
- tipo `product` ou `company`;
- contagens de Nota 1, 2, 3, 4 e 5;
- arquivo de origem;
- data/usuário da importação.

A reimportação do CSV operacional preserva `quality_daily_metrics` e a reimportação de Qualidade não altera atendimentos, Serviço, pontuação ou bonificação.

## 3. Indicadores > Qualidade

Foi criada a aba **Qualidade** dentro de Indicadores, mantendo o mesmo filtro diário do painel.

Foram reproduzidos os grupos de gráficos da apresentação semanal:

1. **Avaliação x Qtd. Atendimento** — um gráfico por Squad, combinando quantidade de atendimentos e percentual avaliado;
2. **Percentual x Benchmark** — Taxa Avaliação, Benchmark mínimo 20%, Benchmark bom 60%, Nota Baixa Produto e Nota Baixa Serviço;
3. **Notas Serviço** — distribuição mensal das Notas 1 a 5;
4. **Nota Produto** — distribuição mensal das Notas 1 a 5;
5. **Nota Empresa** — distribuição mensal das Notas 1 a 5.

Também foram adicionados cards executivos com volume, nota média e percentual de notas baixas. A regra de **nota baixa** é Nota 1 + Nota 2 + Nota 3.

## 4. Evolução diária dos técnicos

Para o Admin Geral, a tela agora usa a mesma base `daily_metrics` já carregada no painel em vez de depender exclusivamente do RPC agregado. Isso elimina o cenário em que a página possui dados no período, mas a Evolução diária retorna vazia por divergência do RPC/filtro.

## 5. Técnico desligado no meio do mês

A regra financeira existente foi preservada:

- técnico com produção na competência continua aparecendo no histórico e no relatório/planilha de comissão;
- inativar o usuário não apaga a competência;
- a opção **Desconsiderar na quantidade de técnicos do grupo** retira somente o técnico do denominador usado na Base do Squad;
- atendimentos e notas dele continuam nos totais;
- o modelo individual, pontuação e histórico não são apagados por esse checkbox.

## 6. Banco de dados

Antes de publicar o frontend, execute:

`MIGRACAO_V2.26.0.sql`

A migração cria a tabela, índices, RLS e permissões de `quality_daily_metrics`.

## 7. Ordem recomendada de implantação

1. Fazer backup da versão atual.
2. Executar `MIGRACAO_V2.26.0.sql` no Supabase.
3. Publicar `index.html`, `styles.css` e `app.js` da V2.26.0 (ou o pacote completo).
4. Fazer atualização forçada do navegador.
5. Garantir que o CSV operacional da competência esteja importado.
6. Abrir Importação e selecionar o CSV de Produto/Empresa.
7. Escolher a competência e concluir a importação.
8. Conferir **Indicadores > Qualidade**.

