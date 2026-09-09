# TheLucas4kLab — Sandbox visual LAUEM

Monorepo da **Liga Acadêmica de Urgência e Emergência Médica (LAUEM)**.

Arquitetura (estilo The Sims / app-builder):

- **Editor web externo** (`apps/editor`): monta telas, botões, **imagens/logos/ícones**, vídeos, checklists e textos (pt-BR), com **plano de fundo por tela** (opacidade), formatação de texto e som de clique nos botões.
- **App Flutter somente leitura** (`apps/liga_app`): carrega `content/published.json` + mídia em `assets/media/` + sons em `assets/sounds/`.
- **Conteúdo** em `content/`: `draft.json` (editável), `published.json` (publicado) e `content/media/` (uploads).

O repositório começa **quase vazio** (só uma tela "Início" sem elementos). Nenhum conteúdo clínico de emergência/AVC vem pré-preenchido — você constrói tudo no editor.

## Pré-requisitos

- Node.js 18+ e npm (ou Bun)
- Flutter 3.22+ (stable) no PATH

## Como rodar o editor

```bash
cd apps/editor
npm install
npm run dev
```

Abra `http://localhost:5173`.

O servidor (`server.mjs`) serve a UI (Vite em modo middleware) e a API:

- `GET/PUT /api/draft` — ler/salvar `content/draft.json`
- `POST /api/publish` — copia draft → published, sincroniza JSON + `content/media` → Flutter assets
- `GET /api/published` — lê o publicado
- `POST /api/media` — upload multipart (`file`) → `content/media/` e retorna `{ url: "/media/arquivo" }`
- `GET /media/*` — serve arquivos de `content/media/`

### UX do editor (canvas visual)

Sandbox tipo celular no meio, ferramentas nas laterais (bem simples / "bobinho"):

- **Esquerda**: lista de telas (como atividades do Android) + **Adicionar tela** / remover / definir início.
- **Centro**: **preview ao vivo** num frame de celular — fundo, botões, imagens, vídeo, checklist e texto (não é formulário).
- **Direita**: **Ferramentas** arrastáveis (botão / imagem / vídeo / checklist / texto) + inspetor (X/Y/%, propriedades).
- **Arrastar e soltar**: salva `x`/`y`/`w`/`h` em % (0–100). Sem layout = empilha em coluna.
- **Cruz (D-pad)** + setas do teclado para nudge; **resize** por alças/sliders; frente/trás, duplicar, alinhar, travar, grade.
- **Preview**: navega entre telas; no modo edição, clicar seleciona.
- Topo: **Salvar rascunho**, **Publicar**, **Preview**

Campos novos no inspetor (compatíveis com rascunhos antigos — defaults se ausentes):

1. **Opacidade do fundo** (slider 0–100% → JSON `backgroundOpacity` 0-1)
2. **Texto**: fonte (system + Google Fonts livres), samanho, peso, cor, alinhamento, altura da linha
3. **Botão → Som do clique**: nenhum / clique / pop / beep (assets no app). Preferências som/vibração ficam **no app publicado** (engrenagem), não no JSON.
4. **Altura `h`**, resize, cruz/setas, ordem z, duplicar, alinhar, lock, grade (opcional). Rascunhos antigos sem `h`/`locked` continuam válidos.
5. **Aparência do botão**: `bgColor`, `textColor`, fonte, tamanho, peso, `borderRadius` (Retângulo / Arredondado / Pill), opacidade, borda/padding opcionais. Templates clínicos de 1 toque: **Primário** (azul/verde), **Alerta** (vermelho/âmbar), **Secundário** (outline). Aviso de contraste no inspetor. Rascunhos antigos usam defaults.


## Imagens e mídia

1. URL https ou upload PNG/JPG/GIF/WEBP/SVG no canvas/inspetor.
2. Uploads em content/media/; JSON usa /media/nome.ext.
3. Publicar copia midia para apps/liga_app/assets/media/.
4. Flutter: http(s)=Image.network; /media/=Image.asset; emoji:=texto.

## Atualizar uma cópia local

1. `git pull origin main` (ou baixe ZIP no GitHub).
2. Preserve content/draft.json e content/media/.
3. Reinstale deps do editor e suba o servidor.
4. flutter pub get e rode o app após Publicar.

## Publicar sem a UI

Na raiz do monorepo:

```bash
npm run publish
npm run sync-flutter
npm run publish:sync
```

(Equivale a `node scripts/publish.mjs` e `node scripts/sync-flutter.mjs`.)

## Como rodar o Flutter

Depois de publicar (o asset já vem espelhado na primeira vez):

```bash
cd apps/liga_app
flutter pub get
flutter run -d linux
# ou: flutter run -d chrome
```

O app:

- Renderiza telas do JSON publicado (plano de fundo com opacidade + imagens)
- Aplica formatacao de texto e estilo gráfico de botão (google_fonts, cores, raio, opacidade)
- Com x/y: Stack+Positioned; sem layout: Column
- Navega com pilha em botões `navigate`
- Abre URLs com `url_launcher`
- Checklist com estado local efêmero
- Sons de botao + vibracao (HapticFeedback) se habilitados
- Engrenagem: Silenciar tudo / Som / Vibracao (SharedPreferences)
- Mostra o `disclaimer` em banner
- Estado vazio se não houver telas/elementos

## Schema do conteúdo (JSON)

```json
{
  "version": 1,
  "disclaimer": "string",
  "homeScreenId": "home",
  "screens": [
    {
      "id": "home",
      "title": "Início",
      "backgroundImage": "/media/fundo.png",
      "backgroundOpacity": 0.85,
      "elements": [
        { "id": "btn1", "type": "button", "label": "Ir", "clickSound": "click", "bgColor": "#0d9488", "textColor": "#ffffff", "fontFamily": "system", "fontSize": 16, "fontWeight": 600, "borderRadius": 12, "opacity": 1, "action": { "type": "navigate", "target": "outra" } },
        { "id": "img1", "type": "image", "src": "/media/logo.png", "alt": "Logo", "fit": "contain", "role": "logo" },
        { "id": "vid1", "type": "video", "url": "https://example.com", "title": "Opcional" },
        { "id": "chk1", "type": "checklist", "title": "Lista", "items": [{ "id": "i1", "label": "Item" }] },
        { "id": "txt1", "type": "text", "content": "Parágrafo", "fontFamily": "Roboto", "fontSize": 16, "fontWeight": 400, "color": "#e2e8f0", "textAlign": "left", "lineHeight": 1.45 }
      ]
    }
  ]
}
```

x/y/w opcionais (% 0-100). Sem eles, empilha em coluna.

Campos novos sao opcionais (defaults se faltarem no draft antigo):

- backgroundOpacity (tela): default 1; aceita 0-1 ou 0-100
- texto: fontFamily (system, Roboto, Open Sans, Lato, Nunito, Montserrat), fontSize, fontWeight, color, textAlign, lineHeight
- botao: clickSound (none | click | pop | beep)
- botao estilo: bgColor, textColor, fontFamily, fontSize, fontWeight, borderRadius (px; 999≈pill), opacity (0-1), borderColor/borderWidth/paddingY opcionais

Preferencias soundEnabled / vibrationEnabled NAO entram no JSON — vivem no aparelho via SharedPreferences.

## Próximas ideias (opcional)

- Sombra no botão (elevation / box-shadow)
- Ícone dentro do botão (emoji ou /media)
- Intensidade da animação de press (scale/opacity configurável)



## Estrutura

```
TheLucas4kLab/
  README.md
  STATUS.md
  content/draft.json
  content/published.json
  content/media/
  scripts/publish.mjs
  scripts/sync-flutter.mjs
  apps/editor/
  apps/liga_app/
    assets/content/
    assets/media/
    assets/sounds/
```

## Plataformas

MVP focado em editor web + Flutter (linux/chrome). Desktop/Play Store/App Store ficam para depois — o projeto Flutter já inclui pastas android/ios/macos/windows/linux/web.

## Licença / uso

Conteúdo educacional da LAUEM. O disclaimer do JSON deve permanecer visível no app.
