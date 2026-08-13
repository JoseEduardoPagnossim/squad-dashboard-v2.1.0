# Atualização V2.3.0 → V2.4.0

## 1. Atualizar o banco

No Supabase, abra **SQL Editor > New query** e execute o conteúdo de:

```text
MIGRACAO_V2.4.0.sql
```

A migração adiciona:

- `is_closed`;
- `closed_at`;
- `closed_by`;
- `closed_snapshot`.

Ela não apaga usuários, meses, métricas, metas ou temas existentes.

## 2. Atualizar o GitHub Pages

Mantenha o seu `config.js` já configurado.

Substitua principalmente:

```text
index.html
app.js
styles.css
default-data.js
```

Você também pode substituir os arquivos de documentação.

Não troque seu `config.js` por um arquivo de demonstração.

## 3. Limpar cache

Depois que o GitHub Pages publicar, abra o site e pressione:

```text
Ctrl + F5
```

## 4. Teste recomendado

1. Abra um mês em andamento.
2. Confira as metas individuais.
3. Clique em **Fechar mês** no histórico.
4. Confirme que inputs e botões de edição ficam bloqueados.
5. Tente importar o mesmo mês: o sistema deve impedir.
6. Clique em **Reabrir**.
7. Confirme que a edição volta a funcionar.
8. Feche novamente após o teste.

## 5. Virada de mês

Quando entrar um novo mês:

1. importe o novo mês pelo CSV;
2. abra **Metas e bonificações do mês**;
3. use **Copiar metas do mês anterior** se desejar;
4. ajuste as metas que mudaram;
5. configure as metas gerais do Squad;
6. mantenha o mês aberto durante as atualizações diárias;
7. no encerramento, clique em **Fechar mês**.
