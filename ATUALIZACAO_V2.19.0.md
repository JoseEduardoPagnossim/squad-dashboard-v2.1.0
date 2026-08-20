# Atualização V2.19.0 — checklist de produção

Esta versão altera banco, Edge Functions e frontend. Faça a implantação nesta ordem para evitar telas tentando acessar colunas ou ações ainda não disponíveis.

## 0. Backup

Antes de qualquer alteração:

- salve uma cópia do repositório atual;
- guarde seu `config.js` publicado em local seguro;
- opcionalmente exporte/registre as configurações atuais do Supabase.

**Não substitua o `config.js` que já funciona em produção.**

## 1. Banco de dados

No Supabase:

**SQL Editor → New query**

Execute uma única vez:

```text
MIGRACAO_V2.19.0.sql
```

A migração:

- adiciona `finance_model`, `finance_compare` e `finance_comparison_snapshot` em `squad_months`;
- cria `profile_squad_history` para preservar a vigência de cada técnico por Squad e inicializa o vínculo atual dos técnicos já cadastrados;
- cria políticas de leitura do histórico; gravações são feitas somente pelas Edge Functions com `service_role`.

Ela não apaga meses, usuários, históricos, metas ou dados financeiros existentes.

## 2. Edge Function manage-user

No Supabase:

**Edge Functions → manage-user → Edit/Deploy**

Substitua pelo conteúdo de:

```text
supabase/functions/manage-user/index.ts
```

Publique mantendo a verificação JWT habilitada.

A nova função suporta:

- edição de nome/perfil/vínculo;
- movimentação entre Squads com competência de vigência;
- inativação/reativação com bloqueio/liberação no Authentication;
- exclusão controlada;
- preservação de históricos anteriores à movimentação.

## 3. Edge Function create-user

No Supabase:

**Edge Functions → create-user → Edit/Deploy**

Substitua pelo conteúdo de:

```text
supabase/functions/create-user/index.ts
```

Publique mantendo a verificação JWT habilitada.

A nova função:

- detecta perfil existente antes de criar um e-mail duplicado;
- informa o Squad do cadastro já existente;
- cria o vínculo inicial no histórico de Squads;
- desfaz o usuário do Authentication se a criação do perfil falhar.

## 4. Frontend no GitHub

Use o pacote:

```text
squad-dashboard-v2.19.0-atualizacao-github.zip
```

Substitua os arquivos equivalentes no repositório.

O pacote de atualização **não contém `config.js`**. Mantenha exatamente o arquivo que já está conectado ao seu projeto Supabase.

## 5. Atualização do navegador

Depois que o GitHub Pages terminar o deploy:

1. faça logout;
2. entre novamente;
3. faça `Ctrl + F5`.

## 6. Smoke test recomendado antes de liberar para todos

Faça estes testes com um usuário/competência de teste ou um mês aberto que possa ser conferido:

### Usuários
- criar um técnico de teste;
- editar nome/vínculo;
- inativar e confirmar que o login fica bloqueado;
- reativar e confirmar que o login volta;
- mover um técnico entre Squads usando uma competência válida;
- conferir que meses anteriores continuam no Squad antigo.

### Financeiro
- abrir **Gestão → Bonificação** em um Squad específico;
- selecionar **Base do Squad**;
- conferir média atend./técnico/dia e % Notas 5 consolidados;
- ativar comparação e conferir Base do Squad x Individual;
- alternar o modelo oficial e salvar;
- preencher bônus manual, comissão de vendas e férias em um técnico;
- conferir redistribuição/desconto;
- gerar Excel e PDF.

### Fechamento
- confira que a tela de técnicos não cria barra horizontal;
- em uma competência segura para teste, fechar/reabrir e confirmar que o modelo oficial e os dois cenários permanecem no snapshot.

## 7. Regra Base do Squad para conferência

```text
Média atend./técnico/dia =
  total de atendimentos do Squad
  / dias úteis considerados
  / técnicos ativos com produção

% Notas 5 do Squad =
  total de Notas 5
  / total de atendimentos

Base =
  (comissão da faixa de atendimentos + comissão da faixa de % Notas 5)
  × multiplicador de cancelamento
```

Depois entram ajustes individuais: bônus manual, prêmios, vendas, desconto, redistribuição e férias.

## 8. Compatibilidade com meses antigos

- Meses fechados antes do snapshot financeiro V3 continuam preservados.
- A V2.19 não recalcula automaticamente um histórico fechado.
- Para aplicar os novos modelos a um mês antigo: reabra, confira/configure, gere relatórios e feche novamente.
- Movimentações de técnico registradas na V2.19 preservam o passado conforme a competência informada.

## 9. Em caso de erro

- Erro ao salvar modelo financeiro: confirme `MIGRACAO_V2.19.0.sql`.
- Erro ao mover/inativar usuário: confirme a nova `manage-user`.
- Erro ao criar usuário: confirme a nova `create-user` e consulte os Logs da Edge Function.
- Tela carregando versão antiga: aguarde o Pages e faça `Ctrl + F5`.
