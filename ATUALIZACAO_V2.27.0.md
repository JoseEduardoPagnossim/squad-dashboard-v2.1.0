# Soften Performance Hub V2.27.0

## Escopo da atualização

Esta versão parte da **V2.26.1**. A V2.26.2 não é base desta entrega, preservando a mesma lógica de escopo para as duas importações: o Squad selecionado define o que será importado; em **Todos os Squads**, somente o Admin Geral importa todos.

## 1. Conciliação das fontes de avaliação

A conciliação foi adicionada em **Gestão > Operação**, logo abaixo das importações, e também em **Indicadores > Qualidade**. Assim a conferência pode ser feita imediatamente após importar e volta a aparecer na análise executiva.

Por competência, ela mostra:

- total de notas de Serviço;
- total de notas de Produto;
- total de notas de Empresa;
- diferença Produto x Serviço;
- diferença Empresa x Serviço;
- quantidade de técnicos com divergência;
- botão **Ver técnicos**, detalhando Serviço, Produto, Empresa e as diferenças por técnico/Squad.

A conciliação é somente de auditoria. O sistema não força Serviço = Produto = Empresa e não altera nenhuma das fontes.

## 2. Qualidade independente do CSV operacional

Foi criada a tabela `quality_person_daily_metrics`.

Ela grava Produto/Empresa por **competência + técnico + dia**, vinculada ao mês do Squad e não mais obrigatoriamente a uma linha de `technician_monthly`.

Isso permite manter avaliações de técnicos que:

- foram desligados;
- estão inativos;
- não aparecem no CSV operacional daquela competência;
- ainda possuem avaliações válidas no CSV Produto/Empresa.

A associação do técnico segue esta prioridade:

1. técnico encontrado na própria competência;
2. vínculo histórico mais próximo no Squad;
3. cadastro do usuário/técnico, inclusive inativo.

`NotaServico` do CSV Produto/Empresa continua totalmente ignorada.

## 3. Indicadores > Por dias úteis

Nova tela para comparar competências no mesmo estágio do mês.

Controles:

- competência base;
- últimas 3, 6 ou 12 competências;
- corte no N.º dia útil;
- escolha de Serviço, Produto ou Empresa para o gráfico de notas baixas.

Indicadores:

- atendimentos acumulados;
- média de atendimentos por técnico/dia útil;
- taxa de avaliação;
- total de notas de Serviço;
- percentual de notas baixas de Serviço;
- total de notas de Produto;
- percentual de notas baixas de Produto;
- total de notas de Empresa;
- percentual de notas baixas de Empresa;
- quantidade de técnicos acima e abaixo da referência no corte equalizado;
- distribuição de Nota 1 a Nota 5 para Serviço, Produto e Empresa, com quantidade e percentual.

Gráficos:

- **Atendimentos acumulados por dia útil**;
- **Taxa de avaliação acumulada**;
- **Notas baixas acumuladas por dia útil**.

Os cards superiores comparam a competência base com a competência imediatamente anterior no mesmo número de dias úteis.

## 4. Indicadores > Detalhamento

Nova tela com três rankings Top 10 no período selecionado:

- maior acúmulo de notas baixas de Serviço;
- maior acúmulo de notas baixas de Produto;
- maior acúmulo de notas baixas de Empresa.

Regra de nota baixa: **Nota 1 + Nota 2 + Nota 3**.

Cada linha mostra:

- técnico;
- Squad;
- quantidade de Nota 1, Nota 2 e Nota 3;
- total de avaliações;
- quantidade acumulada de notas baixas;
- percentual de notas baixas.

O ranking é ordenado pela quantidade acumulada, conforme solicitado, e o percentual é exibido como contexto.

## 5. Banco de dados

Antes de publicar o frontend, execute:

`MIGRACAO_V2.27.0.sql`

A migração:

- cria `quality_person_daily_metrics`;
- cria índices e políticas RLS;
- copia os dados já existentes de `quality_daily_metrics` para a nova estrutura;
- preserva a tabela anterior apenas para compatibilidade histórica.

Depois da atualização, recomenda-se reimportar Produto/Empresa da competência atual para que técnicos que antes ficavam sem vínculo sejam recuperados pela nova regra.

## Ordem de implantação

1. Executar `MIGRACAO_V2.27.0.sql` no Supabase.
2. Publicar `index.html`, `app.js` e `styles.css` da V2.27.0.
3. Manter o `config.js` atual de produção.
4. Fazer `Ctrl + F5`.
5. Reimportar Produto/Empresa da competência desejada.
6. Conferir **Gestão > Operação > Conciliação da competência**.
7. Conferir também **Indicadores > Qualidade > Conciliação das fontes**.
8. Validar **Por dias úteis** e **Detalhamento**.
