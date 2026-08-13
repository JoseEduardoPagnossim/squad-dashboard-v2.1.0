# Atualização V2.1.1 -> V2.2.0

Esta atualização troca a fonte de dados diária de XLSX para CSV e adiciona edição mensal das metas/bonificações por técnico.

## Banco de dados

Se a V2.1.1 já está funcionando no mesmo projeto Supabase, **não execute novamente o `supabase_schema.sql`**. A V2.2.0 utiliza as mesmas tabelas.

## Antes de atualizar o GitHub

Guarde o conteúdo do seu `config.js` atual.

Ele deve continuar parecido com:

```js
window.APP_CONFIG = {
  mode: 'supabase',
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabaseAnonKey: 'SUA_CHAVE_PUBLICA'
};
```

## Publicação

Substitua no repositório os arquivos:

- `index.html`
- `styles.css`
- `app.js`
- `default-data.js`

Também pode substituir os arquivos de documentação.

Depois confira se o `config.js` continua com as credenciais do seu projeto.

## Ordem recomendada depois da publicação

1. Entre como Admin geral.
2. Cadastre os técnicos do Squad D em **Usuários**.
3. No campo **Nome do técnico no CSV**, use exatamente o nome do relatório.
4. Selecione Squad D.
5. Abra Administração.
6. Importe o CSV.
7. Selecione Agosto 2026.
8. Confira os técnicos reconhecidos.
9. Preencha **Metas e bonificações do mês**.
10. Teste o login de um técnico.

Depois repita para A, B e E.
