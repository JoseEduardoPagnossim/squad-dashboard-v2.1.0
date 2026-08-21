# Atualização V2.24.1 — Meu Desempenho

## Ajustes realizados

### 1. Perfil duplicado removido da sidebar
O cartão com avatar, nome e perfil que aparecia no topo da sidebar foi removido. O atalho de perfil permanece somente no canto superior direito da aplicação. A opção **Meu perfil** do menu continua disponível normalmente.

### 2. Ranking de gamificação visível para o técnico
Na tela **Meu desempenho**, o ranking de pontos volta a exibir os técnicos do próprio Squad também quando o usuário está logado como Técnico.

O ranking usa o consolidado operacional diário já disponibilizado pelos RPCs da V2.21.0, respeita o calendário selecionado e recalcula a pontuação simulada do período com a mesma fórmula e os mesmos arredondamentos do painel. Nenhum dado financeiro privado é utilizado nessa classificação.

### 3. Meta mensal completa nos cards
Os três KPIs principais agora deixam claro o alvo proporcional do período e o alvo completo da competência:

- Atendimentos: atual / meta proporcional + **Meta mensal completa**.
- Notas 5: atual / meta proporcional + **Meta mensal completa**.
- % Avaliado: percentual atual + **Meta mensal completa**.

A meta mensal de % avaliado usa a meta de avaliação configurada para o Squad na competência oficial selecionada.

## Banco de dados
Não há nova migração SQL nesta versão. O ranking utiliza o consolidado diário já criado pela migração V2.21.0.

## Publicação
1. Preserve o `config.js` de produção.
2. Substitua `index.html`, `app.js` e `styles.css` pelos arquivos desta versão.
3. Faça `Ctrl + F5` após a publicação do GitHub Pages.
