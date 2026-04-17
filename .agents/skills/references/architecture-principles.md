# architecture-principles

- 既存 route/slug/endpoint/schema の互換性維持を優先。
- ページ直書きを避け、module/hook/lib に寄せる。
- fetch は共通 client に集約し、content-type/HTML混入/timeout/retry を統一。
- docs とコードが矛盾した場合はコードを正とし docs を更新する。
