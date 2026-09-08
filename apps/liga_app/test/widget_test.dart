import "package:flutter_test/flutter_test.dart";
import "package:liga_app/main.dart";

void main() {
  testWidgets("app carrega sem crash", (tester) async {
    await tester.pumpWidget(const LigaApp());
    await tester.pump();
    expect(find.byType(LigaApp), findsOneWidget);
  });
}
