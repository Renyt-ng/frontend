import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "@/components/ui/Modal";

describe("Modal", () => {
  it("renders a responsive dialog shell and close control", () => {
    HTMLDialogElement.prototype.showModal = vi.fn(function showModalStub() {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function closeStub() {
      this.open = false;
    });

    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Responsive dialog">
        <p>Body</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog", { name: /responsive dialog/i });

    expect(dialog).toHaveClass("w-[calc(100vw-1rem)]");
    expect(dialog).toHaveClass("sm:max-h-[85vh]");
    expect(screen.getByRole("button", { name: /close dialog/i })).toBeInTheDocument();
  });
});