/**
 * Sidebar component tests
 * Tests that: sidebar renders, all 13 nav links are present, active state works
 * Updated for Nebula design system (icon rail + compact labels)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/Sidebar";

// Mock next/navigation — usePathname
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

import { usePathname } from "next/navigation";
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

// Current nav labels after Nebula redesign
const NAV_LABELS = [
  "Command Center",
  "Missions",
  "Content",
  "Video",
  "Operators",
  "Approvals",
  "Growth",
  "Browser",
  "Revenue",
  "Launchpad",
  "Connectors",
  "Analytics",
  "Settings",
];

const NAV_HREFS = [
  "/",
  "/missions",
  "/content",
  "/video",
  "/operators",
  "/approvals",
  "/growth",
  "/browser",
  "/revenue",
  "/launchpad",
  "/connectors",
  "/analytics",
  "/settings",
];

describe("Sidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<Sidebar />);
    expect(screen.getByText("Agent MOE")).toBeInTheDocument();
  });

  it("renders the Agent MOE logo/wordmark", () => {
    render(<Sidebar />);
    expect(screen.getByText("Agent MOE")).toBeInTheDocument();
  });

  it("renders all 13 navigation labels", () => {
    render(<Sidebar />);
    NAV_LABELS.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("renders all 13 navigation links with correct hrefs", () => {
    render(<Sidebar />);
    const links = screen.getAllByRole("link");
    const linkHrefs = links.map((l) => l.getAttribute("href"));
    NAV_HREFS.forEach((href) => {
      expect(linkHrefs).toContain(href);
    });
  });

  it("marks the dashboard link as active when on /", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Sidebar />);

    const dashboardLink = screen.getByRole("link", {
      name: /command center/i,
    });
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });

  it("does not mark dashboard as active on a different route", () => {
    mockUsePathname.mockReturnValue("/content");
    render(<Sidebar />);

    const dashboardLink = screen.getByRole("link", {
      name: /command center/i,
    });
    expect(dashboardLink).not.toHaveAttribute("aria-current", "page");
  });

  it("marks the content link as active when on /content", () => {
    mockUsePathname.mockReturnValue("/content");
    render(<Sidebar />);

    const contentLink = screen.getByRole("link", {
      name: /^content$/i,
    });
    expect(contentLink).toHaveAttribute("aria-current", "page");
  });

  it("marks the operators link as active when on /operators/detail", () => {
    mockUsePathname.mockReturnValue("/operators/detail");
    render(<Sidebar />);

    const operatorsLink = screen.getByRole("link", { name: /operators/i });
    expect(operatorsLink).toHaveAttribute("aria-current", "page");
  });

  it("only one nav item is active at a time (dashboard route)", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Sidebar />);

    const activeLinks = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("aria-current") === "page");
    expect(activeLinks).toHaveLength(1);
  });

  it("only one nav item is active at a time (settings route)", () => {
    mockUsePathname.mockReturnValue("/settings");
    render(<Sidebar />);

    const activeLinks = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("aria-current") === "page");
    expect(activeLinks).toHaveLength(1);
  });

  it("renders the main navigation landmark", () => {
    render(<Sidebar />);
    expect(
      screen.getByRole("navigation", { name: /main navigation/i })
    ).toBeInTheDocument();
  });
});
