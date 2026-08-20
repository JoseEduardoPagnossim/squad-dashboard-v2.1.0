# Soften Performance Hub V2.19.0

Painel multi-Squad da Soften Sistemas para acompanhamento diário e mensal, gamificação, indicadores, gestão de usuários e fechamento financeiro auditável.

Squads atuais: **A, B, D e E**.

## Destaques da V2.19.0

- **Dois modelos financeiros no mesmo mês**: `Base do Squad` e `Individual`.
- O Admin escolhe qual modelo é o **oficial** e pode manter a **comparação** ligada sem afetar o valor oficial.
- Fechamento financeiro por técnico reformulado em cards responsivos, sem tabela horizontal.
- Relatórios Excel/PDF mostram os dois cenários, diferença e valor oficial.
- Movimentação de técnico entre Squads pela interface com **competência de vigência** e preservação do passado.
- **Inativar/Reativar** bloqueia/libera o login sem apagar históricos.
- Criação de usuário identifica perfil já existente antes de tentar duplicar e faz rollback se a criação do perfil falhar.
- Sidebar reorganizada em grupos: **Desempenho**, **Gestão** e **Conta**.
- “Como usar” refeito para refletir todo o fluxo atual.

## Navegação

### Desempenho
- **Meu desempenho**: painel individual, status auditável, histórico e financeiro do próprio técnico.
- **Visão do Squad**: ranking, histórico por técnico, comparativos consolidados dos Squads, volume diário do setor e gráfico de todos os técnicos.
- **Indicadores**: análise executiva exclusiva do Admin Geral.

### Gestão
- **Operação**: CSV, metas, referências, fechamento/reabertura e histórico de meses.
- **Bonificação**: modelo financeiro, comparação, regras, cancelamento, valores manuais, férias, relatórios e comissão do Admin Geral.
- **Usuários**: criar, editar, movimentar, inativar/reativar e excluir.
- **Aparência**: tema, fundo, favicon e trilha sonora.

### Conta
- **Meu perfil**: dados da conta e troca de senha com validação da senha atual.
- **Como usar**: guia completo e matriz de permissões.

## Importação CSV

Colunas esperadas:

```text
time
Tecnico
grupoAtendimento
Quantidade
Nota 5
Nota 4
Nota 3
Nota 2
Nota 1
```

O vínculo de técnico normaliza espaços, caracteres invisíveis e acentuação.

A reimportação é de **estado atualizado**: importar novamente o mesmo Squad/mês substitui os dados operacionais anteriores; **não soma**. Metas, parâmetros e valores financeiros manuais já cadastrados são preservados.

## Gamificação

A gamificação permanece separada do financeiro.

O status individual compara quatro indicadores com as **médias atuais do próprio Squad**:

1. atendimentos;
2. total de avaliações;
3. nota média;
4. percentual avaliado (`total de avaliações / atendimentos`).

Regra:

```text
2, 3 ou 4 critérios atingidos => ACIMA
0 ou 1 critério atingido      => ABAIXO
sem atendimento               => sem status
```

A pontuação mantém a fórmula de atendimentos × nota média com bônus/penalidades pelos quatro critérios. O status da equipe replica a regra da planilha: fica ACIMA quando pelo menos 50% dos técnicos válidos possuem pontuação acima da média do grupo.

## Financeiro: dois modelos

### 1. Base do Squad

Modelo compartilhado para reproduzir a política atual.

```text
Média atend./técnico/dia do Squad =
  atendimentos totais do Squad
  / dias úteis considerados
  / técnicos ativos com produção

% Notas 5 do Squad =
  total de Notas 5 do Squad
  / total de atendimentos do Squad
```

As duas métricas encontram suas faixas de comissão; o subtotal recebe o multiplicador de cancelamento. Essa base é compartilhada pelos técnicos com produção. Depois entram os ajustes individuais.

### 2. Individual

Modelo meritocrático. Cada técnico utiliza:

```text
Média atend./dia individual = atendimentos do técnico / dias úteis considerados
% Notas 5 individual = Notas 5 do técnico / atendimentos do técnico
```

As faixas são encontradas individualmente e recebem o mesmo multiplicador de cancelamento da competência do Squad.

### Componentes comuns aos dois modelos

Após a base do modelo escolhido, o sistema aplica:

```text
+ bônus manual
+ prêmio de maior atendimento
+ prêmio de maior quantidade de Notas 5
+ comissão de vendas
- desconto para status ABAIXO
+ redistribuição do total descontado entre os ACIMA do mesmo Squad
```

Em empate nos prêmios, o valor é dividido igualmente.

Se o técnico estiver marcado como **Férias**, somente ao final:

```text
valor calculado × 50% = valor final
```

Sem atendimentos e sem avaliações no mês, a bonificação é zero.

## Comparação financeira

Em **Gestão → Bonificação**:

- escolha `Base do Squad` ou `Individual` como **modelo oficial**;
- ative/desative **Exibir comparação entre os dois modelos**;
- confira a folha total dos dois cenários e o impacto financeiro;
- compare cada técnico individualmente.

O checkbox de comparação é apenas analítico. O valor exibido como **oficial** e congelado no fechamento é sempre o modelo selecionado.

## Comissão do Admin Geral

A comissão mensal do Admin Geral é informada manualmente como valor total, por competência, e não participa das regras financeiras dos Squads.

## Relatórios

Em **Gestão → Bonificação** existem:

- **Relatório Excel**: técnicos, ambos os modelos, diferença, modelo oficial, valor oficial, ajustes e aba de resumo; inclui Admin Geral quando houver comissão cadastrada.
- **Relatório PDF**: conferência compacta com os dois modelos e o valor oficial.

As bibliotecas de exportação são carregadas sob demanda pela internet.

## Movimentação de técnicos entre Squads

Admin Geral pode editar o usuário e trocar o Squad informando a competência de início.

Exemplo:

```text
Squad D até 07/2026
Squad A a partir de 08/2026
```

O sistema registra a vigência em `profile_squad_history`, mantém meses anteriores no Squad antigo e passa a usar o novo vínculo na competência escolhida. Reimportações históricas consultam esse histórico antes do perfil atual.

Movimentações futuras não são agendadas automaticamente; use o mês atual ou uma competência anterior.

## Inativar, reativar e excluir

- **Inativar**: define o perfil como inativo e bloqueia o login no Supabase Auth; históricos permanecem.
- **Reativar**: libera novamente o login.
- **Excluir**: ação excepcional para cadastro incorreto; remove o acesso, mas os registros mensais já existentes não são apagados pelo fluxo normal de históricos.

Admin de Squad gerencia somente técnicos do próprio Squad. Movimentações entre Squads são exclusivas do Admin Geral.

## Fechamento mensal

Antes de fechar:

1. importe o CSV final da competência;
2. confira metas e gamificação;
3. escolha o modelo financeiro oficial;
4. confira cancelamento, bônus manual, vendas e férias;
5. gere Excel/PDF;
6. feche o mês.

O snapshot V3 congela gamificação, modelo financeiro oficial, opção de comparação, regras, métricas da Base do Squad e os dois cenários por técnico.

Para corrigir, reabra o mês, faça o ajuste e feche novamente.

## Atualização da V2.18.1 para V2.19.0

**Ordem obrigatória:** banco → Edge Functions → frontend.

1. Faça backup do repositório e do `config.js` publicado.
2. No Supabase SQL Editor, execute **`MIGRACAO_V2.19.0.sql`** uma única vez.
3. Republique a Edge Function **`manage-user`** com `supabase/functions/manage-user/index.ts`.
4. Republique a Edge Function **`create-user`** com `supabase/functions/create-user/index.ts`.
5. Mantenha a verificação JWT habilitada nas funções.
6. Atualize o GitHub com `squad-dashboard-v2.19.0-atualizacao-github.zip`.
7. **Não substitua seu `config.js` atual**. O ZIP de atualização não inclui esse arquivo.
8. Aguarde o GitHub Pages e faça logout/login + `Ctrl + F5`.
9. Execute os testes de produção descritos em `ATUALIZACAO_V2.19.0.md`.

## Instalação nova

1. Execute `supabase_schema.sql`.
2. Crie o primeiro Admin Geral no Supabase Authentication.
3. Execute `bootstrap_primeiro_admin.sql` com o UUID do primeiro Admin.
4. Publique `create-user` e `manage-user`.
5. Configure `config.js` com URL e chave pública do Supabase.
6. Configure a URL do GitHub Pages em Authentication → URL Configuration.

Consulte também `GUIA_BANCO_DADOS.md`.
