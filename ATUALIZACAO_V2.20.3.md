# Atualização V2.20.3

## Correções

1. **Pontuação / histórico após inativação**
   - A fórmula de pontuação da V2.20.2 estava correta, porém a reimportação considerava somente usuários ativos.
   - Ao inativar um técnico que já havia trabalhado no mês, ele deixava de entrar na reimportação e isso alterava as médias do Squad usadas como referência, mudando a pontuação dos demais.
   - Agora técnicos inativados continuam elegíveis para dados históricos do CSV. A inativação bloqueia apenas o login.
   - Técnicos já existentes em competências históricas também continuam reconhecidos, ajudando a preservar meses anteriores após movimentações.

2. **Botão Sair**
   - Foi movido para o grupo **Conta** da sidebar, junto de Meu perfil e Como usar.
   - Em zoom elevado ou viewport baixo, a campanha lateral é ocultada e a sidebar passa a permitir rolagem, mantendo os controles acessíveis.

## Pontuação equivalente à planilha

As referências automáticas continuam:

- atendimento: média arredondada para 0 casas;
- total de avaliações: média arredondada para 0 casas;
- nota média: média truncada para 2 casas;
- % avaliado: média arredondada para 4 casas.

## Atualização

Não há SQL novo e não é necessário republicar Edge Functions. Substitua os arquivos do frontend, preserve seu `config.js`, faça logout/login e `Ctrl + F5`. Depois reimporte a competência aberta para reconstruir os dados com todos os técnicos que possuem registros no CSV.
