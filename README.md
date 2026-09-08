# TheLucas4kLab — Sandbox visual LAUEM

Monorepo da **Liga Acadêmica de Urgência e Emergência Médica (LAUEM)**.

Arquitetura (estilo The Sims / app-builder):

- **Editor web externo** (`apps/editor`): monta telas, botões, **imagens/logos/ícones**, vídeos, checklists e textos (pt-BR), com **plano de fundo por tela**.
- **App Flutter somente leitura** (`apps/liga_app`): carrega `content/published.json` + mídia em `assets/media/`.
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
- **Arrastar e soltar**: salva `x`/`y`/`w` em % (0–100). Sem layout = empilha em coluna.
- **Preview**: navega entre telas; no modo edição, clicar seleciona.
- Topo: **Salvar rascunho**, **Publicar**, **Preview**

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

- Renderiza telas do JSON publicado (plano de fundo + imagens)
- Com x/y: Stack+Positioned; sem layout: Column
- Navega com pilha em botões `navigate`
- Abre URLs com `url_launcher`
- Checklist com estado local efêmero
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
      "elements": [
        { "id": "btn1", "type": "button", "label": "Ir", "action": { "type": "navigate", "target": "outra" } },
        { "id": "img1", "type": "image", "src": "/media/logo.png", "alt": "Logo", "fit": "contain", "role": "logo" },
        { "id": "vid1", "type": "video", "url": "https://example.com", "title": "Opcional" },
        { "id": "chk1", "type": "checklist", "title": "Lista", "items": [{ "id": "i1", "label": "Item" }] },
        { "id": "txt1", "type": "text", "content": "Parágrafo" }
      ]
    }
  ]
}
```

x/y/w opcionais (% 0-100). Sem eles, empilha em coluna.

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
```

## Plataformas

MVP focado em editor web + Flutter (linux/chrome). Desktop/Play Store/App Store ficam para depois — o projeto Flutter já inclui pastas android/ios/macos/windows/linux/web.

## Licença / uso

Conteúdo educacional da LAUEM. O disclaimer do JSON deve permanecer visível no app.
