import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";

jest.mock("@/auth/logout", () => ({
  useLogout: () => jest.fn(),
}));

jest.mock("@/auth/useGetAuthStatus", () => ({
  useGetAuthStatus: () => ({
    isAuthenticated: false,
    isPending: false,
    session: null,
  }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

jest.mock("@/components/User/User", () => {
  return function MockUser() {
    return <div>User</div>;
  };
});

describe("Header on landing page", () => {
  test("shows landing navigation and sign in action", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: /how it works/i })).toHaveAttribute(
      "href",
      "/#how-it-works",
    );
    expect(screen.getByRole("link", { name: /technical/i })).toHaveAttribute(
      "href",
      "/#credibility",
    );
    expect(screen.getByRole("link", { name: /^sign in$/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
