import { describe, expect, it } from "vitest";
import {
  getAgentVerificationDocumentLabel,
  validateAgentVerificationFile,
} from "@/lib/agentVerification";

describe("agentVerification", () => {
  it("returns readable document labels", () => {
    expect(getAgentVerificationDocumentLabel("government_id")).toBe("Government ID");
  });

  it("validates mime type and size", () => {
    const validFile = new File(["abc"], "id.pdf", { type: "application/pdf" });
    const invalidFile = new File(["abc"], "id.exe", { type: "application/x-msdownload" });

    expect(
      validateAgentVerificationFile(validFile, {
        allowed_mime_types: ["application/pdf"],
        max_file_size_mb: 1,
      }),
    ).toBeNull();

    expect(
      validateAgentVerificationFile(invalidFile, {
        allowed_mime_types: ["application/pdf"],
        max_file_size_mb: 1,
      }),
    ).toMatch(/upload a pdf/i);
  });
});