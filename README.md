# Soften Performance Hub V2.20.3

## Correções da V2.20.3

- Reimportar um mês não remove mais técnicos apenas porque o acesso foi **inativado** depois. A inativação bloqueia login, mas preserva o técnico nos dados históricos, nas médias, no status e na pontuação.
- A pontuação continua usando as referências equivalentes à planilha: atendimento e total de avaliações arredondados para 0 casas, nota média truncada para 2 casas e percentual avaliado arredondado para 4 casas.
- O botão **Sair** passou para o grupo **Conta** na navegação lateral e permanece acessível em telas com pouco espaço/zoom elevado.


## Ajustes da V2.20.2

- Pontuação alinhada aos arredondamentos da planilha oficial: atendimentos e total de avaliações arredondados para 0 casas, média de avaliação truncada para 2 casas e percentual avaliado arredondado para 4 casas.
- O percentual individual também é arredondado para 4 casas antes da comparação, como a coluna K da planilha.
- Confirmações de inativar/excluir usuário, copiar regras/metas e fechar/reabrir/excluir mês agora usam dialogs internos do Performance Hub, sem `window.confirm` do navegador.
- Resultado `ABAIXO` da equipe agora recebe tratamento visual vermelho; `ACIMA` permanece verde. A mesma coerência foi reforçada nos status individuais exibidos nos cards.
- Nenhuma alteração de banco ou Edge Function é necessária.



## Ajustes da V2.20.1

- Tela **Meu desempenho** reorganizada para eliminar o grande espaço vazio abaixo do histórico diário.
- **Histórico do mês** não usa mais rolagem vertical interna no desktop; a página passa a controlar a rolagem naturalmente.
- Os rankings **Ranking atual** e **Ranking por valor recebido** ficam lado a lado abaixo do histórico no desktop e empilham em telas menores.
- Ao navegar entre telas, a página volta automaticamente ao topo.
- Nenhuma alteração de banco, SQL ou Edge Function é necessária em relação à V2.20.0.

Painel multi-Squad da Soften Sistemas para acompanhamento diário e mensal, gamificação, indicadores, gestão de usuários e fechamento financeiro auditável.

Squads atuais: **A, B, D e E**.

## Destaques da V2.20.0

- Dois modelos financeiros continuam coexistindo: **Base do Squad** e **Individual**.
- O Admin define o **modelo oficial** da competência.
- Existe uma nova opção independente: **Mostrar comparação ao técnico no Meu desempenho**. Ela serve para períodos de transição; desligada, o técnico vê apenas o modelo oficial.
- A comparação liberada ao técnico mostra somente os dois valores do próprio usuário. Parâmetros internos do teto não são exibidos.
- O modelo **Individual** possui piso de **R$ 0,00 por técnico**: um cálculo negativo é zerado.
- O modelo **Individual** possui teto mensal da soma paga a todos os técnicos do Squad, com padrão de **R$ 7.000,00**.
- Se o Individual ultrapassar o teto, o sistema reduz proporcionalmente os valores individuais e fecha a soma em no máximo o teto configurado. Essa auditoria é exclusiva dos gestores.
- A redistribuição continua sendo feita **somente entre técnicos ACIMA** do mesmo Squad.
- Técnicos passam a ver um **ranking por valor oficial recebido** com todos os técnicos do próprio grupo.
- **Indicadores** passa a ter ranking financeiro pelo valor oficial acumulado no período selecionado.
- O bloco de **contas de demonstração foi removido da tela de login**.
- A importação CSV agora também atualiza no banco os cálculos financeiros já recalculados, evitando ranking financeiro desatualizado após reimportações diárias.

## Financeiro: regras principais

### Base do Squad

A comissão-base usa a média de atendimentos/técnico/dia do Squad e o percentual de Notas 5 do grupo. Depois entram bônus, prêmios, comissão de vendas, desconto, redistribuição e férias.

### Individual

Cada técnico usa sua própria média de atendimentos/dia e seu próprio `% Notas 5 = Notas 5 / atendimentos`.

A ordem do modelo Individual é:

```text
faixas individuais
→ multiplicador de cancelamento
→ bônus / prêmios / vendas
→ desconto
→ redistribuição somente para ACIMA
→ piso mínimo de R$ 0,00
→ férias (50%, quando marcado)
→ teto global do Squad
```

### Teto do Individual

O teto é sobre a **soma total efetivamente paga a todos os técnicos do Squad** no cenário Individual.

Exemplo:

```text
Individual antes do teto: R$ 8.000,00
Teto:                      R$ 7.000,00
Fator proporcional:        87,5%
Folha Individual final:    R$ 7.000,00
```

O gestor vê valor antes do teto, fator, ajuste e valores por técnico. O técnico vê somente o valor oficial e, quando a transição estiver liberada, a simulação do outro modelo — sem exposição do teto.

## Comparação para técnicos

Em **Gestão → Bonificação** existem duas opções diferentes:

- **Exibir comparação administrativa**: controla o comparador da tela de gestão.
- **Mostrar comparação ao técnico no Meu desempenho**: libera temporariamente uma simulação para os técnicos.

A simulação nunca altera o modelo oficial nem o valor oficial da competência.

## Ranking financeiro

### Meu desempenho

Todo técnico pode ver a classificação de bonificação do próprio Squad, com:

```text
posição
nome do técnico
valor oficial da competência
```

Somente o valor final é compartilhado. Componentes como bônus manual, vendas, teto, desconto e redistribuição continuam protegidos.

### Indicadores

O Admin Geral vê um ranking financeiro no período selecionado. Se o filtro tiver vários meses, o ranking soma os valores oficiais de cada competência. Em `Todos os Squads`, identifica também o Squad de cada técnico.

## Gamificação

Continua totalmente separada do financeiro. O status individual usa quatro referências do próprio Squad: atendimentos, total de avaliações, nota média e `% avaliado`. Dois ou mais critérios = **ACIMA**; zero ou um = **ABAIXO**.

## Movimentação e usuários

- Admin Geral pode mover técnico entre Squads pela interface, informando a competência de vigência.
- O histórico em `profile_squad_history` preserva meses antigos.
- Inativar bloqueia login sem apagar histórico; reativar libera novamente.
- Excluir fica reservado para cadastros incorretos.

## Importação CSV

A reimportação do mesmo Squad/mês **substitui** os dados operacionais; não soma. Metas, parâmetros e valores financeiros manuais são preservados. Nomes são normalizados antes do vínculo.

## Fechamento

No fechamento, o snapshot V4 congela:

- gamificação;
- modelo financeiro oficial;
- comparação administrativa;
- liberação ou não da comparação ao técnico;
- teto Individual;
- total Individual antes/depois do teto e fator aplicado;
- dois cenários por técnico;
- regras, ajustes e valor oficial.

## Atualização V2.19.1 → V2.20.0

1. Faça backup do repositório e do `config.js` publicado.
2. No Supabase SQL Editor, execute **`MIGRACAO_V2.20.0.sql`** uma única vez.
3. **Não é necessário republicar Edge Functions** nesta versão.
4. Atualize o GitHub com `squad-dashboard-v2.20.0-atualizacao-github.zip`.
5. O ZIP de atualização não contém `config.js`; preserve seu arquivo atual.
6. Aguarde o GitHub Pages e faça logout/login + `Ctrl + F5`.
7. Em Gestão → Bonificação, confirme o teto de R$ 7.000,00 e deixe a comparação do técnico desligada até desejar iniciar a transição.
8. Teste o ranking financeiro em uma conta de técnico.

Para instalação nova, execute `supabase_schema.sql`, publique as Edge Functions existentes e configure `config.js`.
