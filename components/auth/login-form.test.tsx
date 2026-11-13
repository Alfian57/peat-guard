import { mock, test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const router = {
  replace: mock(() => undefined),
  refresh: mock(() => undefined),
};

mock.module("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

mock.module("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <span role="img" aria-label={alt} data-source={src} />
  ),
}));

const { LoginForm } = await import("@/components/auth/login-form");

test("login fields are labeled and the password can be revealed", async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  expect(screen.getByRole("textbox", { name: /Email/i })).toBeTruthy();
  expect(
    screen
      .getByLabelText(/Kata sandi/i, { selector: "input" })
      .getAttribute("type"),
  ).toBe("password");
  expect(screen.queryByText("atau coba akun demo")).toBeNull();

  await user.click(
    screen.getByRole("button", { name: "Tampilkan kata sandi" }),
  );

  expect(
    screen
      .getByLabelText(/Kata sandi/i, { selector: "input" })
      .getAttribute("type"),
  ).toBe("text");
  expect(
    screen.getByRole("button", { name: "Sembunyikan kata sandi" }),
  ).toBeTruthy();
});
