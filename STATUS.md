# STATUS — TheLucas4kLab

Data: 2026-09-08 (America/Sao_Paulo, UTC-3)

## O que funciona

- Monorepo com content/, apps/editor, apps/liga_app, scripts/.
- Editor: canvas visual (celular no centro), DnD, multi-tela.
- Schema: layout opcional x/y/w/h em % (0-100) + locked.
- Flutter: Stack+Positioned com x/y/w/h; Column no fallback.
- API draft/publish/media intacta.
- GitHub: lucasmedeiros4k/TheLucas4kLab.

## UX canvas (2026-09-08)

- Centro = preview ao vivo; laterais = telas + ferramentas/inspetor.
- Arrastar elementos para o frame; Preview navega; edicao seleciona.
- Cruz (D-pad) + setas do teclado; resize por alças; grade opcional.

## Features 1 / 2 / 4 (2026-09-08)

1. Opacidade do fundo — backgroundOpacity (0-1) + slider no inspetor da tela; Flutter usa Opacity/ColorFilter.
2. Formatacao de texto — fontFamily (Google Fonts livres), fontSize, fontWeight, color, textAlign, lineHeight; preview no canvas; ElementRenderer aplica estilos.
4. Sons / mute / vibracao — clickSound no botao; SharedPreferences no app; engrenagem Silenciar/Som/Vibracao; assets click/pop/beep.
- Login NAO implementado (fora do escopo).

## Controles finos + resize + animacoes (2026-09-08)

- D-pad / cruz (canvas + inspetor) e setas; Shift = passo maior; passo 0,5% / 1% / 5%.
- Resize w/h (%) com sliders + alças no elemento selecionado; clamp min/max.
- Frente/trás (ordem z), duplicar, alinhar (esq/centro/dir/topo/meio/baixo), travar posição, grade.
- Preview: CSS fade-slide ao trocar tela; Flutter: PageRouteBuilder fade-slide + AnimatedScale no botão.
- draft.json antigo: h/locked ausentes = defaults (altura auto, unlocked).
