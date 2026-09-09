import "package:flutter_test/flutter_test.dart";
import "package:liga_app/models/content.dart";

void main() {
  test("draft antigo tem defaults", () {
    final c = AppContent.fromJson({
      "version": 1,
      "disclaimer": "x",
      "homeScreenId": "home",
      "screens": [{
        "id": "home",
        "title": "Inicio",
        "elements": [
          {"id": "t", "type": "text", "content": "hi"},
          {"id": "b", "type": "button", "label": "Ok", "action": {"type": "navigate", "target": ""}},
        ]
      }]
    });
    expect(c.screens.first.backgroundOpacity, 1.0);
    final t = c.screens.first.elements[0] as TextElement;
    expect(t.fontFamily, "system");
    expect(t.fontSize, 16);
    final b = c.screens.first.elements[1] as ButtonElement;
    expect(b.clickSound, "none");
    expect(b.h, isNull);
    expect(b.locked, isFalse);
    expect(b.bgColor, "#38bdf8");
    expect(b.textColor, "#0f172a");
    expect(b.borderRadius, 12);
    expect(b.opacity, 1.0);
    expect(b.fontWeight.value, 600);
    final styled = ContentElement.fromJson({
      "id": "b2",
      "type": "button",
      "label": "Alerta",
      "action": {"type": "navigate", "target": ""},
      "bgColor": "#dc2626",
      "textColor": "#ffffff",
      "borderRadius": 999,
      "opacity": 0.9,
      "fontFamily": "Roboto",
      "fontSize": 18,
      "fontWeight": 700,
      "borderWidth": 2,
      "borderColor": "#f59e0b",
      "w": 80,
      "h": 8,
    }) as ButtonElement;
    expect(styled.bgColor, "#dc2626");
    expect(styled.borderRadius, 999);
    expect(styled.opacity, 0.9);
    expect(styled.h, 8);
    final withH = ContentElement.fromJson({
      "id": "i", "type": "image", "src": "", "x": 10, "y": 10, "w": 50, "h": 30, "locked": true,
    }) as ImageElement;
    expect(withH.h, 30);
    expect(withH.locked, isTrue);
    final s2 = AppScreen.fromJson({"id": "a", "title": "A", "backgroundOpacity": 80, "elements": []});
    expect(s2.backgroundOpacity, 0.8);
  });
}
