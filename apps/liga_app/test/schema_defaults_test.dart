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
    final s2 = AppScreen.fromJson({"id": "a", "title": "A", "backgroundOpacity": 80, "elements": []});
    expect(s2.backgroundOpacity, 0.8);
  });
}
