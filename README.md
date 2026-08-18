# Soften Performance Hub V2.17.0

Painel web multi-Squad da Soften Sistemas para acompanhamento diário e mensal de desempenho dos técnicos, com autenticação Supabase, histórico mensal, indicadores executivos e visão consolidada do setor.

**Squads atuais:** A, B, D e E.

## O que existe na V2.17.0

### Perfis e acessos

- **Admin geral:** acessa todos os Squads, Indicadores, usuários, importações, metas, temas e fechamento mensal.
- **Admin do Squad:** administra técnicos, importação, metas e tema somente do próprio Squad.
- **Técnico:** acompanha o próprio desempenho, a Visão do Squad, comparativos consolidados do setor, gráfico geral de técnicos e o próprio perfil.
- Cada usuário pode trocar a própria senha em **Meu perfil**, informando a senha atual. A recuperação por e-mail continua disponível caso a senha atual seja esquecida.

### Atualização por CSV

A fonte operacional é o CSV com as colunas:

```text
time
Tecnico
grupoAtendimento
Quantidade
Nota 5
Nota 4
Nota 3
Nota 2
Nota 1
```

O vínculo com o técnico faz limpeza automática do nome: remove espaços nas extremidades, múltiplos espaços, espaços Unicode/invisíveis e diferenças de acentuação antes da comparação.

Ao reimportar o mesmo Squad/mês, os dados operacionais são **substituídos**, não somados. Metas, parâmetros, bônus e descontos já preenchidos continuam preservados enquanto o mês estiver aberto.

### Pontuação e status do técnico

A pontuação mensal segue a lógica da planilha:

```text
Pontos = Atendimentos × Média da avaliação
       + (Atendimentos >= referência ? +20 : -20)
       + (Total de avaliações >= referência ? +30 : -30)
       + (Média da avaliação >= referência ? +40 : -40)
       + (% avaliado >= referência ? +35 : -35)
```

São quatro critérios auditáveis: atendimentos, total de avaliações, nota média e % avaliado. O técnico fica **ACIMA** quando atinge pelo menos 2 dos 4 critérios; com 0 ou 1 fica **ABAIXO**.

Enquanto o mês está aberto, referências mensais manuais de volume (atendimentos e avaliações) são proporcionalizadas pelos dias úteis transcorridos. Se o parâmetro ficar vazio, é usada a média atual do Squad. No fechamento, as referências integrais são aplicadas e congeladas.

### Status da equipe

O status do Squad replica a regra da planilha: calcula a média de pontos dos técnicos válidos e verifica quantos têm pontuação **maior** que a média. Se pelo menos 50% estiverem acima da média, a equipe fica **ACIMA**; caso contrário, **ABAIXO**.

### Visão do Squad e visão do setor

Além de ranking e KPIs do mês, a Visão do Squad contém histórico dos técnicos e comparativos consolidados acessíveis a todos os perfis autenticados:

- quantidade de atendimentos por Squad/mês;
- taxa de avaliação mensal por Squad;
- atendimentos diários consolidados do setor x média do período;
- botão **Todos os técnicos**, com gráfico em tela cheia e métricas de Pontuação, Atendimentos, % de avaliação e Nota média.

Os gráficos são responsivos e, a partir da V2.15.0, não usam barra de rolagem horizontal. Em séries diárias longas, todos os pontos continuam no gráfico e os rótulos do eixo são espaçados automaticamente para preservar a leitura.

### Indicadores do Admin geral

A tela **Indicadores** oferece filtros de período e análises como:

- técnicos ACIMA/ABAIXO por mês;
- % de avaliação mensal e semanal por grupo;
- atendimentos por hora/minuto, considerando 8 horas diárias;
- eficiência de excelência;
- status da equipe no período;
- histórico comparativo dos Squads;
- consolidado diário do setor;
- gráfico geral de todos os técnicos em tela cheia.

### Fechamento mensal

Enquanto o mês estiver **ABERTO**, ele pode ser reimportado e recalculado. Ao clicar em **Fechar mês**, são congelados dados, metas, parâmetros, pontos, status, ranking, bônus, desconto e referências utilizadas. Para corrigir um histórico fechado, use **Reabrir → corrigir → conferir → fechar novamente**.

### Tema, favicon e trilha sonora

Cada Squad possui tema próprio salvo no JSON de `squad_themes`:

- cor principal e secundária;
- fundo e demais cores;
- imagem de fundo;
- nome/frase do tema;
- **favicon da aba do navegador**;
- **trilha sonora ambiente opcional**, com nome e volume padrão.

O favicon padrão é um dragão (`assets/favicon-dragon.png`). Em **Administração → Tema do Squad → Personalizar tema**, o Admin pode escolher outro PNG/JPG/WEBP/GIF de até 750 KB. Ao trocar de Squad, o favicon acompanha automaticamente o tema daquele Squad. Importação/exportação de tema JSON também preserva favicon e trilha sonora.

A campanha **Casa do Dragão** da barra lateral continua sendo uma identidade do setor e não muda com o tema individual do Squad.

### Trilha sonora ambiente

A V2.17.0 adiciona uma trilha opcional por tema. O pacote inclui `assets/casa-do-dragao-ambient.mp3`, uma ambientação original criada para o projeto.

No primeiro acesso de cada usuário naquele navegador, o sistema pergunta se ele deseja **Entrar com trilha** ou **Entrar sem som**. A preferência é lembrada localmente. Quando a trilha está ativa, o player compacto da lateral permite:

- reproduzir e pausar;
- silenciar e reativar;
- ajustar o volume;
- manter a preferência de volume entre acessos.

Como navegadores modernos bloqueiam áudio automático sem interação, após uma atualização de página o sistema aguarda o primeiro clique/tecla do usuário antes de retomar a reprodução quando necessário. A entrada possui fade-in suave e a faixa toca em loop.

Em **Administração → Tema do Squad → Personalizar experiência**, o administrador pode escolher MP3/OGG/WAV/M4A/AAC de até 3 MB, definir o nome, ouvir uma prévia, ajustar o volume padrão, restaurar a trilha original ou remover o áudio. A trilha acompanha a troca de tema/Squad. Use apenas áudio original, licenciado ou royalty-free.


## Atualização para V2.17.0

Esta versão é somente frontend. **Não existe nova migração SQL nem nova Edge Function.**

1. Preserve o seu `config.js` atual, que contém a URL e a Publishable/Anon Key do Supabase.
2. Substitua os arquivos da aplicação pelos da V2.17.0.
3. Garanta que `assets/favicon-dragon.png` e `assets/casa-do-dragao-ambient.mp3` sejam publicados junto com os demais assets.
4. Publique no GitHub Pages.
5. Faça `Ctrl + F5` no navegador.

As migrações já utilizadas pelas versões anteriores continuam necessárias em instalações que ainda não as executaram, especialmente `MIGRACAO_V2.4.0.sql`, `MIGRACAO_V2.11.0.sql`, `MIGRACAO_V2.13.0.sql` e `MIGRACAO_V2.14.0.sql` conforme os recursos utilizados.

## Arquivos principais

```text
index.html                         Interface
styles.css                        Estilos
app.js                            Regras, importação, gráficos e cálculos
default-data.js                   Dados de demonstração
config.js                         Configuração pública do Supabase
assets/favicon-dragon.png         Favicon padrão
assets/casa-do-dragao-ambient.mp3 Trilha ambiente original
assets/casa-do-dragao-sidebar.png Arte da campanha lateral
supabase_schema.sql               Schema completo para instalação nova
MIGRACAO_V2.4.0.sql               Fechamento mensal
MIGRACAO_V2.11.0.sql              Consolidado por Squad
MIGRACAO_V2.13.0.sql              Dados consolidados/técnicos autorizados
MIGRACAO_V2.14.0.sql              Consolidado diário do setor
supabase/functions/create-user/   Criação segura de usuários
supabase/functions/manage-user/   Edição/exclusão segura de usuários
```

## Segurança

- `service_role` nunca fica no navegador;
- criação, edição e exclusão administrativa de usuários ocorre pelas Edge Functions;
- Admin do Squad permanece limitado ao próprio Squad;
- Admin geral administra a organização inteira;
- visões compartilhadas com técnicos usam dados consolidados/autorizados pelas funções SQL correspondentes;
- senhas não são exibidas aos administradores;
- mês fechado precisa ser reaberto antes de alterações administrativas.

## V2.15.0 — melhorias visuais

- favicon de dragão padrão e favicon configurável por tema;
- README e **Como usar** atualizados para os recursos atuais;
- gráficos históricos e consolidados sem scroll horizontal;
- eixo temporal reduz automaticamente a quantidade de rótulos em séries longas;
- inputs numéricos sem os spinners nativos do navegador, com visual alinhado aos componentes modernos do sistema.


## V2.16.0 — gráficos e comparação no hover

A V2.16.0 moderniza os gráficos de linha com foco em leitura de séries múltiplas:

- linhas mais leves e com menor poluição visual;
- grade horizontal mais discreta;
- régua vertical ao passar o mouse por um período;
- **tooltip compartilhado por período**, exibindo todas as séries daquele mês/dia, inclusive quando dois técnicos ou Squads têm exatamente o mesmo ponto;
- valores do tooltip ordenados do maior para o menor;
- legendas interativas: passe o mouse para destacar uma série e clique para mantê-la em foco;
- em gráficos com muitas séries, o tooltip usa duas colunas para manter todos os técnicos visíveis;
- o comportamento também é aplicado ao gráfico em tela cheia de todos os técnicos e aos históricos de atendimento.

Não há alteração de banco de dados nesta versão.


## V2.17.0 — ambientação sonora

- trilha ambiente opcional por tema;
- faixa original `Fogo & Conquista` incluída no projeto;
- escolha inicial com som ou sem som;
- fade-in, loop e volume inicial baixo;
- player persistente na sidebar;
- volume/mute/preferência lembrados por usuário no navegador;
- upload e prévia de áudio no editor de tema;
- troca automática da trilha ao trocar de tema/Squad;
- exportação/importação do JSON de tema preservando a trilha.

Não há alteração de banco de dados nesta versão.
