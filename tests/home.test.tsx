import { render, screen } from "@testing-library/react";
import HomePage from "../app/page";

describe("HomePage", () => {
  it("renders the app title", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /IG Follow Audit/i })
    ).toBeInTheDocument();
  });
});
