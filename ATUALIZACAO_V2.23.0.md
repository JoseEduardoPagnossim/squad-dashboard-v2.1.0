# Atualização V2.23.0 — Gráficos e Métricas Premium

## O que mudou

A V2.23.0 é exclusivamente visual. Ela moderniza todos os gráficos SVG, barras de progresso, indicadores circulares, tooltips e o selo de ranking sem alterar qualquer regra de negócio.

### Gráficos
- curvas suaves em vez de polylines pontiagudas;
- área com gradiente por série;
- barras históricas em gradiente;
- grade horizontal pontilhada e discreta;
- pontos e séries ganham glow apenas em interação/foco;
- tooltip glassmorphism;
- animação de entrada respeitando `prefers-reduced-motion`.

### Métricas
- barras de progresso `rounded-full` com gradiente `--accent2` → `--accent`;
- glow discreto na ponta ativa;
- valores principais com maior hierarquia tipográfica;
- ranking orbital/holográfico e XP ring modernizado.

### Tema
Todos os efeitos usam `var(--accent)`, `var(--accent2)`, `var(--panel)`, `var(--bg)`, `var(--text)`, `var(--muted)` e demais variáveis já alimentadas pelo JSON do tema.

## Implantação

Não há SQL nem Edge Function nova. Substitua `index.html`, `styles.css` e `app.js`, preserve seu `config.js` de produção e faça `Ctrl + F5`.
