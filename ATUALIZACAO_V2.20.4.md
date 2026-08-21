# Atualização V2.20.4

## Correção da média usada na pontuação

A reimportação diária agora preserva o último consolidado de um técnico que já teve produção na competência quando ele deixa de aparecer em uma extração posterior do CSV. Isso evita que a quantidade de técnicos caia artificialmente e altere as médias usadas como B11, I11, J11 e K11.

Técnicos presentes no CSV continuam sendo substituídos pelos valores atualizados. Linhas de resumo como Média Grupo, Total Grupo e Resultado Equipe não são preservadas.

## Atualização

- Não executar SQL novo.
- Não republicar Edge Functions.
- Substituir os arquivos do frontend pelo pacote V2.20.4, preservando o `config.js` de produção.
- Depois da publicação, reimportar Agosto uma vez para reconstruir a competência com a composição correta da média.

## Validação com o exemplo enviado

Com os 8 técnicos e valores do print, as referências ficam:

- B11 = 161
- I11 = 55
- J11 = 4,97
- K11 = 32,98%

Para Arthur Santos, com 173 atendimentos, 85 avaliações, média 4,94 e 49,13% avaliado, a pontuação resultante é **899,62**.
