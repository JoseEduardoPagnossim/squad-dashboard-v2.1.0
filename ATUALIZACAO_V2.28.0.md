# Soften Performance Hub V2.28.0

## Escopo da atualização

A V2.28.0 implementa três melhorias sem alterar as regras existentes de pontuação, metas ou bonificação:

1. contexto visual de férias nos indicadores;
2. revisão global de legibilidade e responsividade;
3. base histórica e confidencial de custo-hora dos técnicos para uso futuro na análise de custos do Suporte.

## 1. Férias como contexto nos indicadores

A informação já existente em **Bonificação > Férias no mês** continua sendo a única fonte da marcação.

A regra financeira não mudou: quando o checkbox está marcado, a bonificação final do técnico continua sendo reduzida para 50% conforme a lógica já existente.

A V2.28.0 apenas reaproveita esse dado como contexto visual:

- pontos de competências com férias recebem um halo diferenciado nos gráficos históricos por técnico;
- o tooltip identifica a competência como **férias**;
- rankings e tabelas exibem badge/ícone de férias quando aplicável;
- a matriz histórica de status destaca a célula do mês com férias;
- o gráfico em tela cheia de todos os técnicos também usa o marcador diferenciado.

A marcação de férias **não recalcula produtividade, status, pontos, metas ou qualidade**.

## 2. Revisão visual global

Foi criada uma escala tipográfica mais consistente para priorizar a leitura dos dados secundários.

Principais ajustes:

- eixos, tooltips, rankings, tabelas e informações auxiliares passam a usar tamanhos mais legíveis;
- textos operacionais relevantes deixam de depender de fontes de 7–9 px;
- cards financeiros foram reorganizados em grids flexíveis;
- em resoluções menores os blocos quebram em 2 ou 1 coluna, em vez de reduzir a fonte para caber;
- campos, labels, auditorias e detalhes financeiros receberam maior espaçamento e altura de linha.

## 3. Gestão > Custos

Nova tela disponível somente para **Admin Geral**.

O objetivo desta etapa é apenas construir a base histórica necessária para a futura análise de custo de atendimento.

### Escopo

A tela é **geral do Suporte técnico**, sem filtro ou agrupamento por Squad.

O cadastro interno continua sendo individual porque o custo futuro precisa considerar o valor-hora real de cada técnico:

`Técnico + competência + custo/hora`

Isso permite preservar o histórico quando o custo do técnico mudar ao longo do tempo.

### Recursos

- selecionar a competência;
- informar custo/hora por técnico;
- salvar os valores historicamente;
- copiar os custos da competência anterior;
- manter técnicos históricos mesmo quando não possuem produção na competência atual;
- indicador de cobertura dos valores cadastrados.

Os valores são protegidos por RLS e podem ser lidos/escritos somente por **Admin Geral da mesma organização**.

## O que ainda não entra nesta versão

A V2.28.0 **não calcula custo de chamados** e não cria dashboards de custo por produto, problema, tempo ou atendimento.

Essa etapa ficará para depois da definição e validação do CSV que trará os dados de tempo dos chamados. Assim o cálculo será construído diretamente sobre a estrutura correta, sem estimativas ou adaptações prematuras.

## Banco de dados

Execute **antes de publicar o frontend**:

`MIGRACAO_V2.28.0.sql`

A migração cria:

`public.support_technician_hourly_costs`

A tabela é organizacional, histórica por competência e não possui vínculo de escopo com Squad.

## Ordem para publicação

1. Executar `MIGRACAO_V2.28.0.sql` no SQL Editor do Supabase.
2. Publicar `index.html`, `app.js` e `styles.css` da V2.28.0.
3. Manter o `config.js` atual da produção.
4. Fazer `Ctrl + F5` no navegador.
5. Validar uma competência com técnico marcado em férias nos gráficos históricos.
6. Abrir **Gestão > Custos**, cadastrar uma competência e testar **Copiar mês anterior**.

## Compatibilidade

- mantém as importações Serviço e Produto/Empresa da V2.27.4;
- mantém Indicadores > Qualidade, Por dias úteis e Detalhamento;
- mantém a regra de férias de 50% da bonificação sem qualquer alteração;
- mantém técnico desligado/inativo no histórico conforme as regras anteriores.
