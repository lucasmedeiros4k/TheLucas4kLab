# STATUS — TheLucas4kLab

Data: 2026-09-08 (America/Sao_Paulo, UTC-3)

## O que funciona

- Monorepo com content/, apps/editor, apps/liga_app, scripts/.
- Editor: canvas visual (celular no centro), DnD, multi-tela.
- Schema: layout opcional x/y/w em % (0-100).
- Flutter: Stack+Positioned com x/y; Column no fallback.
- API draft/publish/media intacta.
- GitHub: lucasmedeiros4k/TheLucas4kLab.

## UX canvas (2026-09-08)

- Centro = preview ao vivo; laterais = telas + ferramentas/inspetor.
- Arrastar elementos para o frame; Preview navega; edicao seleciona.

## Features 1 / 2 / 4 (2026-09-08)

1. Opacidade do fundo — backgroundOpacity (0-1) + slider no inspetor da tela; Flutter usa Opacity/ColorFilter.
2. Formatacao de texto — fontFamily (Google Fonts livres), fontSize, fontWeight, color, textAlign, lineHeight; preview no canvas; ElementRenderer aplica estilos.
4. Sons / mute / vibracao — clickSound no botao; SharedPreferences no app; engrenagem Silenciar/Som/Vibracao; assets click/pop/beep.
- Login NAO implementado (fora do escopo).
