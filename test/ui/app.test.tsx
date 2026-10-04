// App shell: the auth gate, routes, legacy hash redirects and the lazy parlay route.
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import App from "@/App";
import { clubhouse, mockFetch } from "./helpers";

const session = (authenticated: boolean) => ({ "/api/auth/session": () => ({ authenticated, commissioner: false }) });
const at = (route: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );

describe("App", () => {
  it("shows a busy placeholder, then the lock screen for anonymous visitors", async () => {
    mockFetch(session(false));
    const { container } = at("/teams");
    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument();
    expect(await screen.findByText("Enter league password")).toBeInTheDocument();
    expect(screen.queryByText("League Teams")).not.toBeInTheDocument();
  });

  it("routes members to each section and redirects legacy hashes and /home", async () => {
    mockFetch(session(true));
    at("/#keepers");
    expect(await screen.findByText("Keeper Selections")).toBeInTheDocument();
    for (const [route, heading] of [
      ["/teams", "League Teams"],
      ["/history", "Final Standings"],
      ["/proposals", "Active Proposals"],
      ["/home", "League Rules"],
      ["/nowhere", "Oops! Page not found"],
    ] as const) {
      mockFetch(session(true));
      const { unmount } = at(route);
      expect(await screen.findByText(heading)).toBeInTheDocument();
      unmount();
    }
  });

  it("lazy-loads the parlay page", async () => {
    mockFetch({ ...session(true), "/api/parlay": () => clubhouse() });
    at("/parlay");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Week 3" })).toBeInTheDocument(), { timeout: 5000 });
  });
});
