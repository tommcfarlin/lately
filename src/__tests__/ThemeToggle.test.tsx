import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ThemeToggle from "@/components/ThemeToggle";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

beforeEach(() => {
  localStorageMock.clear();
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
  document.documentElement.classList.remove("dark");
});

describe("ThemeToggle", () => {
  it("toggles dark class on html element when clicked", async () => {
    await act(async () => {
      render(<ThemeToggle />);
    });
    const button = screen.getByRole("button", { name: /toggle color scheme/i });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    fireEvent.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists theme preference to localStorage", async () => {
    await act(async () => {
      render(<ThemeToggle />);
    });
    const button = screen.getByRole("button", { name: /toggle color scheme/i });
    fireEvent.click(button);
    expect(localStorageMock.getItem("theme")).toBe("dark");
    fireEvent.click(button);
    expect(localStorageMock.getItem("theme")).toBe("light");
  });
});
