# Atualização para V2.6.0

## 1. Atualizar os arquivos do site

Substitua os arquivos do GitHub Pages pelos desta versão e **mantenha o seu `config.js` atual**.

## 2. Publicar a nova Edge Function

A V2.6.0 adiciona a função:

```text
supabase/functions/manage-user/index.ts
```

### Pelo Dashboard do Supabase

1. Abra **Edge Functions**.
2. Crie uma nova função chamada exatamente `manage-user`.
3. Cole todo o conteúdo de `supabase/functions/manage-user/index.ts`.
4. Faça o deploy.
5. Mantenha a verificação JWT ativada.

### Pela CLI

```bash
supabase functions deploy manage-user
```

## 3. Banco de dados

Não existe nova migração SQL nesta versão. A exclusão do usuário usa o comportamento já existente do banco: `profiles` é removido em cascata e `technician_monthly.user_id` vira `null`, preservando o histórico mensal.

## Regras de edição

- E-mail: não editável.
- Senha: não editável pelo Admin; o usuário usa recuperação de senha.
- Nome: editável.
- Nome no CSV: editável para técnicos.
- Perfil e Squad: Admin geral pode ajustar.
- Admin do Squad: pode editar/excluir somente técnicos do próprio Squad.
- O próprio usuário logado não pode excluir ou alterar seu próprio acesso por esta tela.
- Super admins não podem ser excluídos pela interface.
