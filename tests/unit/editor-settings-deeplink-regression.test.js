import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

describe("editor settings deep links", () => {
  it("passes the settings query parameter to ProductsContent", () => {
    const editorPage = readFileSync("app/editor/[storeSlug]/page.tsx", "utf8");
    const productsContent = readFileSync(
      "components/pages/editor/components/products-content.tsx",
      "utf8",
    );

    expect(editorPage).toContain("useSearchParams");
    expect(editorPage).toContain('searchParams.get("settings")');
    expect(editorPage).toContain("initialSettingsTab={initialSettingsTab}");
    expect(productsContent).toContain("initialSettingsTab?: string");
    expect(productsContent).toContain("useState(() => Boolean(initialSettingsTab))");
    expect(productsContent).toContain('initialTab={initialSettingsTab ?? "delivery"}');
  });
});
