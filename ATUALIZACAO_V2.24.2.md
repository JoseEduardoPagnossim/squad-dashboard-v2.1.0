# Atualização V2.24.2

## Correção: ranking do game no login do Técnico

O ranking de pontuação na tela **Meu desempenho** agora é carregado por uma função segura específica do banco (`get_my_squad_game_ranking`).

### Correção
- O Técnico passa a enxergar todos os integrantes do **próprio Squad** no ranking do game.
- A consulta não libera dados de outros Squads.
- O ranking respeita o calendário diário selecionado (`De` / `Até`).
- Pontuação, médias e critérios seguem a mesma fórmula e os mesmos arredondamentos do frontend/planilha.
- O ranking financeiro permanece inalterado.

### Instalação
1. Execute `MIGRACAO_V2.24.2.sql` no Supabase SQL Editor.
2. Publique os arquivos da atualização no GitHub Pages.
3. Preserve o `config.js` de produção.
4. Saia e entre novamente no login de Técnico e faça `Ctrl + F5`.

Não é necessário republicar Edge Functions.
