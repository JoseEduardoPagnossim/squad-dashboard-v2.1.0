# Atualização V2.17.0 — trilha ambiente por tema

## Novidades

A V2.17.0 adiciona ambientação sonora opcional ao Soften Performance Hub.

- trilha original **Fogo & Conquista** incluída em `assets/casa-do-dragao-ambient.mp3`;
- tela inicial de escolha **Entrar com trilha / Entrar sem som** no primeiro acesso daquele usuário e navegador;
- volume inicial baixo (18%) e fade-in suave;
- player compacto na barra lateral com reproduzir/pausar, silenciar e volume;
- preferência de som, mute e volume lembrada no navegador por usuário;
- em atualizações de página, quando o usuário deixou a trilha ativa, ela volta no primeiro gesto permitido pelo navegador;
- reprodução em loop;
- trilha acompanha o tema do Squad, assim como fundo e favicon;
- Admin pode escolher MP3/OGG/WAV/M4A/AAC de até 3 MB, alterar o nome, testar a trilha e definir o volume padrão;
- botões para restaurar a trilha original ou remover a trilha daquele tema;
- importação e exportação de tema JSON preservam a configuração da trilha;
- **Como Usar** atualizado com os controles de áudio.

## Direitos autorais

A trilha incluída neste pacote foi criada especificamente para esta versão do projeto como ambientação instrumental sintética. Para trilhas substituídas pelo administrador, utilize apenas material original, licenciado ou royalty-free.

## Banco de dados

Não existe nova tabela, coluna ou Edge Function nesta versão. A configuração de áudio é gravada no mesmo JSON de `squad_themes` já utilizado pelos temas.

> Observação: arquivos de áudio personalizados são incorporados ao JSON do tema. Para manter o tema leve, o painel limita o upload a 3 MB.

## Atualização

1. Preserve o `config.js` que já funciona no ambiente publicado.
2. Substitua os arquivos da aplicação pelos da V2.17.0.
3. Publique também `assets/casa-do-dragao-ambient.mp3`.
4. Faça `Ctrl + F5`.
5. Abra **Administração → Tema do Squad** para testar ou trocar a trilha.

Nenhuma migração SQL nova precisa ser executada.
