import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "./Tabs";

describe("Tabs", () => {
  it("shows the default tab and switches content on trigger click", async () => {
    const user = userEvent.setup();
    render(
      <TabsRoot defaultValue="preview">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="assistant">Assistant</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">Preview body</TabsContent>
        <TabsContent value="assistant">Assistant body</TabsContent>
      </TabsRoot>,
    );

    expect(screen.getByText("Preview body")).toBeTruthy();
    expect(screen.queryByText("Assistant body")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Assistant" }));

    expect(screen.getByText("Assistant body")).toBeTruthy();
    expect(screen.queryByText("Preview body")).toBeNull();
  });
});
