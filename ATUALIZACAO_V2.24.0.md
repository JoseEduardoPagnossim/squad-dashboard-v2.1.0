# Atualização V2.24.0 — Light & Dark Mode Premium

## O que foi implementado

- Alternância instantânea entre **Modo Claro** e **Modo Escuro** pelo botão Sol/Lua no cabeçalho.
- O login também possui o mesmo controle para que o usuário possa escolher o modo antes de entrar no painel.
- A preferência é salva no `localStorage`. Quando ainda não existe preferência manual, o painel usa `prefers-color-scheme` do sistema operacional.
- O modo pode mudar sem recarregar a página e sem reiniciar a lógica de negócio.
- O modo claro usa fundo off-white, cards brancos/elevados, texto em tons slate, bordas suaves e sombras de baixo contraste.
- O modo escuro mantém superfícies profundas em camadas, glassmorphism e contraste confortável.
- Cards, sidebar, topbar, modais, login, tela de carregamento, tooltips, gráficos, tabelas e controles receberam tratamento específico para os dois modos.

## Tema JSON V2

A exportação de tema passa a usar `schema: "squad-theme-v2"` e inclui:

```json
{
  "colors": {
    "dark": {
      "accent": "#f0a33a",
      "secondary": "#ef5a29",
      "bg": "#080b12",
      "bg2": "#10141e",
      "panel": "rgba(17,22,31,.88)",
      "panel2": "rgba(24,30,42,.92)",
      "text": "#f5f6f8",
      "muted": "#9aa3b1",
      "border": "rgba(255,255,255,.09)"
    },
    "light": {
      "accent": "#d97706",
      "secondary": "#ea580c",
      "bg": "#f3f6fa",
      "bg2": "#f8fafc",
      "panel": "rgba(255,255,255,.94)",
      "panel2": "#ffffff",
      "text": "#0f172a",
      "muted": "#64748b",
      "border": "rgba(148,163,184,.32)"
    }
  }
}
```

Temas antigos `squad-theme-v1` continuam aceitos e são convertidos automaticamente para a estrutura dual.

## Edição pelo painel

Em **Gestão → Aparência → Personalizar tema** existe um seletor **Claro / Escuro**. Os campos **Cor principal** e **Cor secundária** editam somente a paleta que estiver ativa, sem apagar a outra.

Fundo, favicon, nome, campanha e trilha continuam compartilhados entre Light e Dark, preservando a identidade visual do Squad e a campanha Casa do Dragão.

## Banco / deploy

- Não há migração SQL nova.
- Não há Edge Function nova.
- A coluna JSON já existente em `squad_themes.theme` recebe a nova estrutura sem alteração de schema no banco.
- Preserve o `config.js` de produção ao publicar.
