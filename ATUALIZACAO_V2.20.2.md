# Atualização V2.20.2

## Alterações

1. Pontuação passou a usar os mesmos arredondamentos da planilha `STATUS DO SQUAD`:
   - referência de atendimentos: `ROUND(AVERAGE(...),0)`;
   - referência de total de avaliações: `ROUND(AVERAGE(...),0)`;
   - referência de nota média: `ROUNDDOWN(AVERAGE(...),2)`;
   - referência de percentual avaliado: `ROUND(AVERAGE(...),4)`.
2. O percentual avaliado individual também é arredondado em 4 casas antes da comparação.
3. O status financeiro usa as mesmas referências arredondadas, mantendo o desconto/redistribuição coerente com o status do técnico.
4. Todas as confirmações nativas (`window.confirm`) foram substituídas por dialogs internos do sistema.
5. Resultado da equipe `ABAIXO` agora aparece em vermelho; `ACIMA` permanece em verde. Os cards individuais de status também reforçam vermelho/verde de forma consistente.

## Publicação

- Não executar SQL novo.
- Não republicar Edge Functions.
- Preserve o `config.js` já configurado em produção.
- Substitua os arquivos do pacote de atualização e faça `Ctrl + F5`.
