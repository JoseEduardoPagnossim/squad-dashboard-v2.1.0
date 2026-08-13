# Atualização V2.2.x → V2.3.0

## 1. Atualizar o banco

No Supabase, abra **SQL Editor** e execute o conteúdo de:

```text
MIGRACAO_V2.3.0.sql
```

A migração apenas adiciona `score_settings` em `squad_months`. Ela não apaga usuários nem meses já importados.

## 2. Preservar o config.js

Guarde seu `config.js` atual, que contém Project URL e Publishable key.

## 3. Atualizar o GitHub Pages

Substitua os arquivos do site pelos da V2.3.0 e mantenha seu `config.js` configurado.

Depois faça `Ctrl + F5`.

## 4. Validar a pontuação

Abra um Squad e um mês já importado.

Em **Administração > Parâmetros da fórmula mensal** você verá as referências automáticas do Squad. Se todos os campos estiverem vazios, a pontuação usa essas médias automaticamente.

Clique em **Salvar parâmetros e recalcular** para gravar no banco os pontos, metas batidas, status e ranking recalculados do mês.

## 5. Funcionamento diário

Ao reimportar o CSV do mesmo mês, a pontuação é recalculada automaticamente usando os novos dados e os parâmetros salvos para aquele mês.
