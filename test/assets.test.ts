import { describe, expect, it } from "vitest";
import { isPublicAsset, serveAsset } from "../worker/assets";
import type { AppEnv } from "../worker/env";

describe("isPublicAsset", () => {
  it("allows only the shell, hashed bundles and lock-screen files", () => {
    for (const p of ["/", "/index.html", "/favicon.ico", "/league-logo.jpg", "/robots.txt", "/assets/index-abc.js"])
      expect(isPublicAsset(p), p).toBe(true);
    for (const p of ["/cole.png", "/Apex-Bylaws.pdf", "/towers.jpg", "/teams", "/assets", "/Assets/x.js"])
      expect(isPublicAsset(p), p).toBe(false);
  });

  it("refuses encoded separators and dot segments", () => {
    for (const p of [
      "/assets/..%2fApex-Bylaws.pdf",
      "/assets/..%2FApex-Bylaws.pdf",
      "/assets/..%5cx",
      "/assets/../x",
      "/assets//x",
    ])
      expect(isPublicAsset(p), p).toBe(false);
  });
});

describe("serveAsset", () => {
  const env = (seen: string[]): AppEnv =>
    ({
      ASSETS: {
        fetch: async (req: Request) => {
          seen.push(new URL(req.url).pathname);
          return new Response("ok");
        },
      },
    }) as unknown as AppEnv;

  it("serves private files only with a session, otherwise the shell", async () => {
    const seen: string[] = [];
    await serveAsset(new Request("https://x.invalid/cole.png"), env(seen), false);
    await serveAsset(new Request("https://x.invalid/cole.png"), env(seen), true);
    await serveAsset(new Request("https://x.invalid/assets/app.js"), env(seen), false);
    expect(seen).toEqual(["/", "/cole.png", "/assets/app.js"]);
  });
});
