import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("shows the chapter and stage name", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "1-1 숲길의 습격" }),
    ).toBeInTheDocument();
  });
});
