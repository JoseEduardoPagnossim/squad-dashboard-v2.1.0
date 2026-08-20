# Atualização V2.20.1

Correção visual e de navegação sobre a V2.20.0.

## O que mudou

- O Histórico do mês deixa de ficar esticado artificialmente pela coluna dos rankings.
- A tabela diária deixa de ter rolagem vertical interna desnecessária no desktop.
- Ranking atual e Ranking por valor recebido passam a ocupar duas colunas abaixo do histórico, evitando áreas vazias.
- Em telas menores, os rankings voltam a uma coluna automaticamente.
- Toda troca de tela pela sidebar ou atalhos reposiciona a página no topo.

## Como publicar

1. Preserve o `config.js` atual de produção.
2. Substitua `index.html`, `app.js` e `styles.css` pelos arquivos desta versão.
3. Aguarde o GitHub Pages publicar.
4. Faça `Ctrl + F5`.

**Não execute SQL novo e não republique Edge Functions.** A V2.20.1 usa a mesma estrutura de banco da V2.20.0.
