# Atualização V2.7.0

## 1. Visual Casa do Dragão

O frontend foi refinado para ficar mais próximo do conceito visual aprovado: sidebar mais cinematográfica, campanha integrada à lateral, cartões mais profundos, detalhes dourados e uma tela “Como usar” reorganizada no mesmo estilo do mockup.

## 2. Vínculo de técnico no CSV

Antes da comparação, o sistema agora:

- remove espaços no início e no final;
- transforma espaços Unicode/NBSP em espaço comum;
- remove caracteres invisíveis como zero-width space e BOM;
- reduz múltiplos espaços internos para um;
- remove acentos e padroniza caixa para o vínculo;
- na chave de comparação, ignora todos os espaços.

Exemplo: `JOÃO PEDRO ELIAS `, `JOAO PEDRO ELIAS`, `JOÃO  PEDRO ELIAS` e `JOAOPEDROELIAS` passam a usar a mesma chave de vínculo. O nome exibido continua legível.

## 3. Carregamento ao atualizar a página

Ao recarregar o GitHub Pages, a aplicação mostra “Preparando seu painel” enquanto o Supabase valida a sessão. Se o usuário já estava autenticado, o painel abre sem piscar a tela de login.

## 4. Modais de usuário

Os modais de criação e edição de usuário agora são de backdrop estático. Eles não fecham ao selecionar texto, usar Ctrl+C ou soltar o mouse fora da caixa. Para fechar, use X ou Cancelar.

## Banco

Não é necessária nova migração SQL nem nova Edge Function nesta versão. Mantenha as funções `create-user` e `manage-user` já publicadas.
