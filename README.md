# Soften Performance Hub V2.29.4





## V2.29.4 — Status da equipe alinhado ao status dos técnicos

- Corrige o **Resultado da equipe** na Visão do Squad: ele não é mais definido por `pontuação > média de pontos`.
- O status individual continua seguindo a regra oficial: **2 ou mais dos 4 critérios = ACIMA; 0 ou 1 = ABAIXO**.
- A equipe fica **ACIMA quando pelo menos 50% dos técnicos considerados estão com status ACIMA**.
- Técnicos marcados como **Desconsiderar na quantidade de técnicos do grupo** continuam com produção, pontos e status, mas ficam fora do denominador do resultado da equipe, em linha com a regra já usada nas referências do grupo.
- A pontuação média continua visível apenas como indicador/ranking e deixa explícito que **não define o status da equipe**.
- A mesma regra foi aplicada à Visão do Squad, portfólio de Squads, indicadores do período e competências fechadas (derivando o resultado dos status congelados dos técnicos).
- Não requer nova migração SQL.

## V2.29.3 — Importação operacional mais robusta

- Corrige o vínculo de técnicos presentes no CSV operacional quando o cadastro possui o nome em `full_name`, mas o campo `technician_name` está vazio ou diferente.
- A importação passa a reconhecer, dentro do mesmo Squad: **Nome do técnico**, **Nome completo** e nomes já existentes no histórico do monitor.
- Ativar/inativar o usuário continua sem interferir na importação histórica.
- Ao persistir a competência, o `user_id` também pode ser resolvido pelo Nome completo, evitando técnico importado sem vínculo ao usuário quando `technician_name` não estiver preenchido.
- Não altera cálculos de status, pontuação, bonificação, férias ou a regra `exclude_from_group_count` da V2.29.2.
- **Não exige nova migração SQL.** A V2.29.2 continua sendo pré-requisito para o RPC de ranking/status.

## V2.29.2 — Consistência de referências e status

- mantém a fórmula oficial de status: **2, 3 ou 4 critérios = ACIMA; 0 ou 1 = ABAIXO**;
- amplia o checkbox **Desconsiderar na quantidade de técnicos do grupo**: a produção do técnico continua nos totais, mas ele deixa de compor o divisor das referências de desempenho e continua fora do divisor financeiro da Base do Squad;
- para referências quantitativas, `Atendimentos` e `Total de avaliações` usam o total produzido por todos os técnicos dividido somente pela quantidade de técnicos considerados;
- `Nota média` e `% avaliado` usam somente os técnicos considerados na composição da média, evitando distorção matemática em indicadores proporcionais;
- o técnico desconsiderado continua aparecendo no ranking, mantém seus atendimentos, avaliações, pontos e status individual;
- períodos que cobrem uma competência completa passam a usar o **consolidado mensal oficial** para atendimentos e N1–N5; o detalhe diário permanece apenas para gráficos e recortes parciais. Isso evita divergências entre ranking do mês e consolidado mensal quando o histórico diário estiver desalinhado;
- o marcador `Ø` identifica visualmente técnicos que estão fora do divisor das referências;
- ao salvar o checkbox na Bonificação, o sistema também persiste novamente `status`, `goals_hit`, `points`, `rank` e `team_result` da competência aberta;
- `MIGRACAO_V2.29.2.sql` atualiza o RPC do ranking para técnicos com a mesma regra de referências; não cria novas tabelas ou colunas.

## V2.29.1 — Leitura estratégica do impacto financeiro
- adiciona quatro KPIs executivos em `Indicadores > Impacto financeiro`: cobertura financeira, exposição entre clientes ouvidos, principal origem do risco e receita sem feedback;
- adiciona gráfico histórico `Receita representada x Receita sob sinal`, usando o ticket médio salvo em cada competência;
- amplia a tabela Serviço/Produto/Empresa com a participação de cada dimensão no total de sinais de notas 1 a 3 e destaca a principal origem;
- nenhuma nova informação de cliente é armazenada e não existe nova migração SQL nesta versão;
- todos os indicadores são estimativas baseadas no ticket médio e continuam sem representar churn ou receita perdida confirmada.

## V2.29.0 — Impacto financeiro da qualidade

- nova aba **Indicadores > Impacto financeiro**, exclusiva do Admin Geral;
- visão corporativa do Suporte técnico completo, sem filtro por Squad;
- usa **total de clientes ativos + ticket médio mensal + CSV previamente deduplicado**;
- o CSV real suportado possui `DataAvaliacao`, `NotaServico`, `NotaProduto` e `NotaEmpresa`;
- cada linha válida é tratada como um cliente único da competência;
- nenhum nome, CNPJ ou identificador de cliente é persistido;
- calcula MRR estimado, cobertura da base, receita representada, clientes sob sinal de risco, receita mensal associada ao risco e exposição anual equivalente;
- separa o impacto por **Serviço, Produto e Empresa**;
- mantém histórico por competência;
- “receita sob sinal de risco” é uma associação estimada e **não representa perda confirmada nem previsão de churn**;
- exige executar `MIGRACAO_V2.29.0.sql` antes de publicar.


## V2.28.1 — Custo geral do Suporte

- simplifica **Gestão > Custos** para uma única base mensal do Suporte, sem custo individual por técnico;
- inputs: **custo total com pagamentos**, **outros custos**, **total de técnicos** e **horas úteis por dia**;
- a quantidade de técnicos é sugerida automaticamente a partir da competência importada, mas pode ser ajustada pelo Admin Geral;
- calcula automaticamente **custo total**, **dias úteis**, **capacidade útil em horas/minutos**, **custo por dia útil técnico**, **custo por hora técnica** e **custo por minuto técnico**;
- mantém o botão **Copiar mês anterior** para reaproveitar os valores e revisar a quantidade de técnicos;
- a antiga tabela individual da V2.28.0 fica apenas como legado e não é usada pela tela;
- exige executar `MIGRACAO_V2.28.1.sql` antes de usar a nova tela.

**Fórmula-base:** `custo total = pagamentos + outros custos`; `custo/minuto = custo total ÷ técnicos ÷ dias úteis ÷ horas/dia ÷ 60`.

## V2.28.0 — Férias, legibilidade e base de custos

- reaproveita o checkbox mensal de férias da Bonificação como contexto visual nos indicadores, sem alterar a regra financeira de 50%;
- competências com férias recebem marcador diferenciado, tooltip e badges em rankings/tabelas;
- revisa a escala tipográfica do sistema, aumentando textos operacionais secundários e fazendo cards quebrarem responsivamente em vez de reduzir fonte;
- reorganiza principalmente os cards de Bonificação para leitura mais confortável;
- adiciona **Gestão > Custos**, exclusiva do Admin Geral, com base histórica `Técnico + competência + custo/hora`;
- a tela de Custos é corporativa para todo o Suporte técnico, sem filtro por Squad;
- permite copiar os custos da competência anterior;
- a análise de custo de chamados fica propositalmente para uma próxima etapa, após definição do CSV de tempos;
- exige executar `MIGRACAO_V2.28.0.sql` antes da publicação.


## V2.27.4 — Sincronização histórica de Produto/Empresa

- Mantém o gráfico **Notas baixas acumuladas** da V2.27.2. A V2.27.3 foi descartada.
- Ao importar o CSV Produto/Empresa e confirmar uma competência, o sistema também sincroniza automaticamente as demais competências presentes no mesmo arquivo que já existirem no monitor, seguindo a mesma ideia usada no CSV operacional.
- `NotaServico` continua ignorada no CSV de qualidade.
- Nenhuma nova migração SQL é necessária além da `MIGRACAO_V2.27.0.sql` já aplicada.
- O CSV de qualidade usado na validação atual contém somente **julho/2026 e agosto/2026**. Portanto, Produto/Empresa só podem aparecer nesses meses até que arquivos de competências anteriores sejam importados.

## V2.27.2 — Correção do comparativo por dias úteis

- Mantém todas as competências visíveis nos gráficos, mesmo quando existe pequena divergência entre diário e consolidado mensal.
- Reimportar o CSV operacional sincroniza Notas 1 a 5 diárias dos meses históricos já cadastrados usando o próprio arquivo de últimos 12 meses.
- Divergências passam a gerar aviso visual, não exclusão do mês.
- Não altera consolidado mensal, metas, financeiro ou bonificação.

## V2.27.2 — Correção do histórico diário de notas

- **Indicadores > Por dias úteis** valida se Nota 1 a 5 do detalhamento diário fecham com o consolidado mensal antes de calcular Serviço.
- Reimportar o CSV operacional atual sincroniza automaticamente o detalhamento diário de notas das competências históricas já existentes no mesmo escopo, desde que os totais do CSV coincidam com o consolidado mensal.
- Não altera metas, financeiro, bonificação, Produto/Empresa ou os consolidados mensais históricos.
- Não exige nova migração SQL.

## V2.27.0 — Conciliação, dias úteis e detalhamento

- adiciona conciliação Serviço x Produto x Empresa em **Gestão > Operação** e **Indicadores > Qualidade**, com detalhamento por técnico;
- cria `quality_person_daily_metrics`, permitindo manter Produto/Empresa mesmo quando o técnico não aparece no CSV operacional daquela competência;
- vínculo de qualidade tenta a própria competência, histórico do técnico e cadastro (inclusive inativo);
- mantém as duas importações com a mesma lógica de escopo por Squad / Todos os Squads;
- adiciona **Indicadores > Por dias úteis**, equalizando competências pelo mesmo N.º dia útil e trazendo atendimentos, produtividade, avaliação, qualidade, status acima/abaixo e distribuição de Nota 1 a 5;
- adiciona **Indicadores > Detalhamento**, com Top 10 de notas 1 a 3 de Serviço, Produto e Empresa no período;
- `NotaServico` do CSV Produto/Empresa continua ignorada;
- exige executar `MIGRACAO_V2.27.0.sql` antes de publicar o frontend.


## V2.26.1 — Correção do histórico de notas e importação visível

- Corrige **Indicadores > Qualidade > Notas Serviço** para usar o consolidado mensal oficial quando o filtro cobre toda a competência importada. Isso recupera corretamente Notas 1, 2, 3 e 4 de meses históricos cuja tabela diária antiga não possuía essas colunas.
- Mantém o detalhamento diário para recortes parciais de período.
- Adiciona botão explícito **Importar CSV Produto/Empresa** em **Gestão > Operação**.
- Adiciona também o atalho **Importar Produto/Empresa** no topo de **Indicadores > Qualidade** para administradores.
- Cada botão valida o tipo de CSV escolhido.
- Não há nova migração de banco nesta correção; permanece válida a `MIGRACAO_V2.26.0.sql`.

## V2.26.0 — Indicadores de Qualidade e importação Produto/Empresa

- nova aba **Indicadores > Qualidade**, mantendo os filtros de período do painel;
- reprodução dos gráficos de qualidade da apresentação semanal: **Avaliação x Qtd. Atendimento por Squad**, **Percentual x Benchmark**, **Notas Serviço**, **Nota Produto** e **Nota Empresa**;
- novo CSV de Qualidade sem necessidade de cliente: obrigatórios apenas `Time`, `nomeApresentativo`, `NotaProduto` e `NotaEmpresa`;
- `NotaServico` do CSV de Qualidade é ignorada e nunca altera a base oficial de Serviço;
- avaliações individuais de Produto/Empresa são consolidadas por técnico + dia antes da gravação;
- nova tabela `quality_daily_metrics`, independente de `daily_metrics`;
- correção da **Evolução diária dos técnicos** para o Admin Geral utilizando a base diária já carregada no painel;
- preservada a regra de técnico inativo/desligado: permanece na competência/comissão e pode ser removido somente do denominador via **Desconsiderar na quantidade de técnicos do grupo**.

> Antes de publicar esta versão, execute `MIGRACAO_V2.26.0.sql`.

## V2.24.2 — ajustes em Meu desempenho

- cartão de usuário duplicado removido da sidebar;
- ranking de gamificação do Squad restaurado para login de Técnico;
- cards de Atendimentos, Notas 5 e % Avaliado exibem também a meta mensal completa, além da meta proporcional do calendário.
- sem nova migração SQL; utiliza os RPCs operacionais já existentes desde V2.21.0.


## Novidades da V2.24.2 — Light & Dark Mode Premium

- alternância instantânea por botão Sol/Lua no cabeçalho e na tela de login;
- preferência Light/Dark persistida no navegador, com detecção automática de `prefers-color-scheme` no primeiro acesso;
- temas JSON agora suportam `colors.dark` e `colors.light`, preservando compatibilidade de importação com `squad-theme-v1`;
- modo claro premium com fundo off-white, cards brancos, texto slate, bordas e sombras suaves;
- modo escuro premium preserva superfícies profundas, glassmorphism, temas e imagens existentes;
- em **Aparência**, o Admin pode alternar a paleta em edição e personalizar as cores principal/secundária de cada modo separadamente;
- fundo, favicon, campanha Casa do Dragão e trilha continuam funcionando sem alteração de regra;
- nenhuma migração SQL ou Edge Function nova é necessária.


## Novidades da V2.23.2 — gráficos e métricas premium

- linhas dos gráficos agora usam curvas suaves Bezier/Catmull-Rom;
- preenchimento em área com gradiente derivado da cor de cada série;
- barras históricas com gradiente do tema, cantos arredondados e glow discreto;
- tooltips glassmorphism mantêm a régua compartilhada e o ranking das séries;
- linhas de grade horizontais ficaram pontilhadas e ultradiscretas;
- barras de progresso ganharam gradiente, ponta iluminada e microinterações;
- badge de ranking do técnico virou um selo orbital/holográfico baseado em `--accent` e `--accent2`;
- XP/ring circular também passa a seguir o visual premium;
- todas as cores continuam consumindo as variáveis CSS atualizadas pelo JSON de tema;
- nenhuma regra de negócio, cálculo, importação, fechamento, usuário ou financeiro foi alterada.


## Novidades da V2.22.0 — interface premium e seletor de data digitável

- Refatoração visual inspirada em **Shadcn UI / Tailwind**, preservando a aplicação estática existente e toda a lógica de negócio.
- Cards com raio de 16 px, bordas de baixo contraste, sombras suaves, paddings maiores e hierarquia tipográfica revisada.
- Sidebar, cabeçalho, KPIs, rankings, tabelas, dialogs, formulários, gráficos e telas administrativas receberam a nova camada visual.
- O card **Olá, Técnico** mantém a imagem/campanha configurada por tema e ganhou um ranking flutuante mais leve.
- Atalhos **Hoje / 7 dias / 15 dias / Este mês / Mês anterior** agora funcionam como segmented control.
- Filtros de data visíveis agora são campos de texto `DD/MM/AAAA`, permitindo digitação direta pelo teclado.
- O botão de calendário possui área clicável própria e abre o seletor nativo com `showPicker()` quando suportado.
- A sincronização continua usando ISO (`AAAA-MM-DD`) internamente; nenhuma regra de intervalo diário foi alterada.
- As variáveis de tema (`accent`, `secondary`, `bg`, `bg2`, `panel`, `text`, background, favicon e campanha) continuam sendo aplicadas pelo mesmo JSON e pelas mesmas rotinas existentes.
- **Nenhuma migração SQL ou Edge Function nova é necessária.**


## Novidades da V2.21.0 — calendário diário

- **Meu desempenho**, **Visão do Squad** e **Indicadores** agora usam intervalo diário com calendário.
- O padrão é **primeiro dia do mês atual → última data importada**. Se não houver dados no mês atual, o sistema usa o mês mais recente disponível.
- Atalhos: **Hoje**, **7 dias**, **15 dias**, **Este mês** e **Mês anterior**.
- Atendimentos, notas, avaliações, nota média, gráficos diários, comparativos dos Squads e produtividade por hora/minuto respondem ao intervalo.
- A pontuação, status oficial, metas, fechamento e bonificação continuam por **competência mensal**. Rankings analíticos do período são simulações e não alteram os pontos gravados.
- O histórico diário passa a armazenar também **Nota 4, Nota 3, Nota 2 e Nota 1**, permitindo calcular corretamente total de avaliações e nota média em qualquer recorte diário.
- Execute `MIGRACAO_V2.21.0.sql` antes de publicar o frontend. Depois, reimporte os meses que deseja analisar por dia para preencher a composição histórica completa das avaliações.




## Novidades da V2.20.5

- Novo checkbox financeiro **Desconsiderar na quantidade de técnicos do grupo**, disponível por técnico e por competência.
- Ao marcar, o técnico continua com seus atendimentos e notas somados nos totais, mas deixa de compor apenas o denominador de técnicos usado na **média de atendimentos/técnico/dia da Base do Squad**.
- O `% de Notas 5` do grupo continua considerando todas as Notas 5 e todos os atendimentos, inclusive do técnico desconsiderado.
- O modelo **Individual** não é alterado.
- Desde a V2.29.2, o mesmo checkbox também ajusta o divisor das referências de gamificação/status; a produção do técnico continua preservada nos totais e no próprio ranking.
- O painel de auditoria financeira informa quantos técnicos possuem produção e quantos estão efetivamente sendo considerados no denominador.
- A escolha é preservada em reimportações, gravada por competência, congelada no fechamento e incluída no Excel.
- Esta versão exige executar `MIGRACAO_V2.20.5.sql` antes de publicar o novo frontend.

## Correções da V2.20.4

- A média usada na pontuação passa a preservar todos os técnicos que **já tiveram produção na competência**, mesmo que uma extração posterior do CSV deixe de trazer o nome por inativação ou migração.
- Um técnico ausente no CSV novo mantém o último consolidado já gravado daquele mês; isso evita reduzir artificialmente a quantidade de técnicos e alterar B11, I11, J11 e K11.
- Linhas-resumo antigas como **Média Grupo**, **Total Grupo** e **Resultado Equipe** não são preservadas como técnicos.
- Técnicos que continuam no CSV são atualizados normalmente; a importação continua substitutiva para eles.
- Não há alteração de SQL ou Edge Function.

## Correções da V2.20.3

- Reimportar um mês não remove mais técnicos apenas porque o acesso foi **inativado** depois. A inativação bloqueia login, mas preserva o técnico nos dados históricos, nas médias, no status e na pontuação.
- A pontuação continua usando as referências equivalentes à planilha: atendimento e total de avaliações arredondados para 0 casas, nota média truncada para 2 casas e percentual avaliado arredondado para 4 casas.
- O botão **Sair** passou para o grupo **Conta** na navegação lateral e permanece acessível em telas com pouco espaço/zoom elevado.


## Ajustes da V2.20.2

- Pontuação alinhada aos arredondamentos da planilha oficial: atendimentos e total de avaliações arredondados para 0 casas, média de avaliação truncada para 2 casas e percentual avaliado arredondado para 4 casas.
- O percentual individual também é arredondado para 4 casas antes da comparação, como a coluna K da planilha.
- Confirmações de inativar/excluir usuário, copiar regras/metas e fechar/reabrir/excluir mês agora usam dialogs internos do Performance Hub, sem `window.confirm` do navegador.
- Resultado `ABAIXO` da equipe agora recebe tratamento visual vermelho; `ACIMA` permanece verde. A mesma coerência foi reforçada nos status individuais exibidos nos cards.
- Nenhuma alteração de banco ou Edge Function é necessária.



## Ajustes da V2.20.1

- Tela **Meu desempenho** reorganizada para eliminar o grande espaço vazio abaixo do histórico diário.
- **Histórico do mês** não usa mais rolagem vertical interna no desktop; a página passa a controlar a rolagem naturalmente.
- Os rankings **Ranking atual** e **Ranking por valor recebido** ficam lado a lado abaixo do histórico no desktop e empilham em telas menores.
- Ao navegar entre telas, a página volta automaticamente ao topo.
- Nenhuma alteração de banco, SQL ou Edge Function é necessária em relação à V2.20.0.

Painel multi-Squad da Soften Sistemas para acompanhamento diário e mensal, gamificação, indicadores, gestão de usuários e fechamento financeiro auditável.

Squads atuais: **A, B, D e E**.

## Destaques da V2.20.0

- Dois modelos financeiros continuam coexistindo: **Base do Squad** e **Individual**.
- O Admin define o **modelo oficial** da competência.
- Existe uma nova opção independente: **Mostrar comparação ao técnico no Meu desempenho**. Ela serve para períodos de transição; desligada, o técnico vê apenas o modelo oficial.
- A comparação liberada ao técnico mostra somente os dois valores do próprio usuário. Parâmetros internos do teto não são exibidos.
- O modelo **Individual** possui piso de **R$ 0,00 por técnico**: um cálculo negativo é zerado.
- O modelo **Individual** possui teto mensal da soma paga a todos os técnicos do Squad, com padrão de **R$ 7.000,00**.
- Se o Individual ultrapassar o teto, o sistema reduz proporcionalmente os valores individuais e fecha a soma em no máximo o teto configurado. Essa auditoria é exclusiva dos gestores.
- A redistribuição continua sendo feita **somente entre técnicos ACIMA** do mesmo Squad.
- Técnicos passam a ver um **ranking por valor oficial recebido** com todos os técnicos do próprio grupo.
- **Indicadores** passa a ter ranking financeiro pelo valor oficial acumulado no período selecionado.
- O bloco de **contas de demonstração foi removido da tela de login**.
- A importação CSV agora também atualiza no banco os cálculos financeiros já recalculados, evitando ranking financeiro desatualizado após reimportações diárias.

## Financeiro: regras principais

### Base do Squad

A comissão-base usa a média de atendimentos/técnico/dia do Squad e o percentual de Notas 5 do grupo. Depois entram bônus, prêmios, comissão de vendas, desconto, redistribuição e férias.

### Individual

Cada técnico usa sua própria média de atendimentos/dia e seu próprio `% Notas 5 = Notas 5 / atendimentos`.

A ordem do modelo Individual é:

```text
faixas individuais
→ multiplicador de cancelamento
→ bônus / prêmios / vendas
→ desconto
→ redistribuição somente para ACIMA
→ piso mínimo de R$ 0,00
→ férias (50%, quando marcado)
→ teto global do Squad
```

### Teto do Individual

O teto é sobre a **soma total efetivamente paga a todos os técnicos do Squad** no cenário Individual.

Exemplo:

```text
Individual antes do teto: R$ 8.000,00
Teto:                      R$ 7.000,00
Fator proporcional:        87,5%
Folha Individual final:    R$ 7.000,00
```

O gestor vê valor antes do teto, fator, ajuste e valores por técnico. O técnico vê somente o valor oficial e, quando a transição estiver liberada, a simulação do outro modelo — sem exposição do teto.

## Comparação para técnicos

Em **Gestão → Bonificação** existem duas opções diferentes:

- **Exibir comparação administrativa**: controla o comparador da tela de gestão.
- **Mostrar comparação ao técnico no Meu desempenho**: libera temporariamente uma simulação para os técnicos.

A simulação nunca altera o modelo oficial nem o valor oficial da competência.

## Ranking financeiro

### Meu desempenho

Todo técnico pode ver a classificação de bonificação do próprio Squad, com:

```text
posição
nome do técnico
valor oficial da competência
```

Somente o valor final é compartilhado. Componentes como bônus manual, vendas, teto, desconto e redistribuição continuam protegidos.

### Indicadores

O Admin Geral vê um ranking financeiro no período selecionado. Se o filtro tiver vários meses, o ranking soma os valores oficiais de cada competência. Em `Todos os Squads`, identifica também o Squad de cada técnico.

## Gamificação

Continua totalmente separada do financeiro. O status individual usa quatro referências do próprio Squad: atendimentos, total de avaliações, nota média e `% avaliado`. Dois ou mais critérios = **ACIMA**; zero ou um = **ABAIXO**.

## Movimentação e usuários

- Admin Geral pode mover técnico entre Squads pela interface, informando a competência de vigência.
- O histórico em `profile_squad_history` preserva meses antigos.
- Inativar bloqueia login sem apagar histórico; reativar libera novamente.
- Excluir fica reservado para cadastros incorretos.

## Importação CSV

A reimportação do mesmo Squad/mês **substitui** os dados operacionais; não soma. Metas, parâmetros e valores financeiros manuais são preservados. Nomes são normalizados antes do vínculo.

## Fechamento

No fechamento, o snapshot V4 congela:

- gamificação;
- modelo financeiro oficial;
- comparação administrativa;
- liberação ou não da comparação ao técnico;
- teto Individual;
- total Individual antes/depois do teto e fator aplicado;
- dois cenários por técnico;
- regras, ajustes e valor oficial.

## Atualização V2.19.1 → V2.20.0

1. Faça backup do repositório e do `config.js` publicado.
2. No Supabase SQL Editor, execute **`MIGRACAO_V2.20.0.sql`** uma única vez.
3. **Não é necessário republicar Edge Functions** nesta versão.
4. Atualize o GitHub com `squad-dashboard-v2.20.0-atualizacao-github.zip`.
5. O ZIP de atualização não contém `config.js`; preserve seu arquivo atual.
6. Aguarde o GitHub Pages e faça logout/login + `Ctrl + F5`.
7. Em Gestão → Bonificação, confirme o teto de R$ 7.000,00 e deixe a comparação do técnico desligada até desejar iniciar a transição.
8. Teste o ranking financeiro em uma conta de técnico.

Para instalação nova, execute `supabase_schema.sql`, publique as Edge Functions existentes e configure `config.js`.


## V2.23.2 — correção de gráficos
- Corrige gráficos SVG que podiam ficar achatados/invisíveis em intervalos longos.
- Os gráficos executivos de volume e taxa de avaliação por Squad passam a agrupar por competência mensal.
- O gráfico de ritmo diário continua diário.

## V2.23.2 — estabilidade dos Indicadores

- Restaura `buildStatusMatrix()`, removida acidentalmente durante a refatoração premium dos gráficos.
- Evita que uma falha isolada em um gráfico interrompa a renderização dos demais cards da tela Indicadores.
- Mantém as correções de altura e os consolidados mensais da V2.23.1.

## V2.24.2 — ranking do game para Técnicos

Para que o login de Técnico visualize o ranking completo do próprio Squad respeitando o calendário diário, execute `MIGRACAO_V2.24.2.sql`. A função `get_my_squad_game_ranking` é `SECURITY DEFINER` e limita a consulta ao Squad do usuário autenticado.

### V2.24.3
- Corrige Atendimentos, % de avaliação e Nota média no quadro geral de todos os técnicos, usando consolidado por competência.
- Ajusta o espaçamento da legenda do KPI de % Avaliado em Meu desempenho.


### V2.25.0

- Novo módulo **Gestão → Feedbacks** para Admin Geral e Admin do Squad.
- Geração automática sem IA externa, baseada nos indicadores mensais já existentes.
- Feedback em rascunho, edição do gestor, finalização e histórico por competência.
- Opção **Disponibilizar ao técnico**; quando finalizado, aparece em **Meus feedbacks**.
- Nova migração `MIGRACAO_V2.25.0.sql` cria `technician_feedbacks` com RLS por organização/Squad.
- Em **Indicadores**, novo gráfico em tela cheia **Evolução diária dos técnicos**, com Pontuação diária simulada, Atendimentos, % de avaliação e Nota média.
- O gráfico mensal **Todos os técnicos por competência** continua com sua lógica mensal.
- Legendas dos gráficos em tela cheia agora reservam espaço próprio e permanecem acessíveis em resoluções/alturas menores.

### V2.25.1
- Restaurado o comando **Regerar em lote** em Gestão → Feedbacks. Ele atualiza feedbacks pendentes/rascunhos com os indicadores atuais e preserva os finalizados.
- Adicionado **Regerar** por técnico na listagem e **Regerar conteúdo** dentro do editor.
- A regeneração preserva **Observações do gestor**. Se um feedback finalizado for regerado individualmente, ele volta para rascunho e precisa ser finalizado novamente antes de ser exibido ao técnico.
- Nenhuma alteração de banco de dados é necessária nesta versão.
