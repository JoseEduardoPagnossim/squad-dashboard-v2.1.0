# Atualização V2.22.0 — Interface premium

## O que muda

A V2.22.0 moderniza a camada visual sem alterar o motor de negócio, banco, cálculos ou estrutura de temas.

### Design

- visual inspirado em Shadcn UI / Tailwind, implementado em CSS nativo para manter o projeto estático e compatível com GitHub Pages;
- cards com 16 px, bordas discretas, sombras suaves e espaçamento maior;
- tipografia modernizada com `Segoe UI Variable / Inter / Plus Jakarta Sans` e fallbacks do sistema;
- botões, navegação, tabelas, dialogs, formulários, KPIs e rankings com estados de hover/foco consistentes;
- hero `Olá, Técnico` mantém a imagem atual da campanha e o ranking ganha um painel flutuante mais leve;
- atalhos de data viram segmented control.

### Filtro de data

- o campo visível é `text` com máscara `DD/MM/AAAA`;
- o usuário pode digitar `21082026` e o campo formata para `21/08/2026`;
- Enter ou saída do campo confirma a data;
- datas inválidas recebem estado visual de erro;
- o ícone é um botão real com área clicável de 38 px;
- o botão aciona um `input[type=date]` auxiliar por `showPicker()`/`click()`, mantendo o popup nativo e sem criar hotspot invisível sobre o restante do campo;
- todos os cálculos continuam recebendo datas ISO internamente.

## Preservado integralmente

- regras de pontuação;
- médias e arredondamentos;
- importação CSV;
- bonificação e modelos financeiros;
- regras de usuários e RLS;
- fechamento/reabertura de competência;
- temas por JSON;
- cores principal/secundária, fundos, favicon e trilha;
- imagens Casa do Dragão / Vermithor;
- textos, estatísticas e IDs usados pelo JavaScript.

## Implantação

1. Faça backup do repositório atual.
2. Preserve o `config.js` de produção.
3. Substitua `index.html`, `app.js` e `styles.css` pelos arquivos desta versão.
4. Não execute SQL novo para a V2.22.0. A migração V2.21.0 continua sendo a última migração necessária para o histórico diário completo.
5. Não republique Edge Functions.
6. Após o GitHub Pages publicar, faça `Ctrl + F5`.

