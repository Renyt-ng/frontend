import type { ReactNode } from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { PropertyComposer } from "@/app/(dashboard)/dashboard/properties/PropertyComposer";
import { useAuthStore } from "@/stores/authStore";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

const { mockRouter, hooks } = vi.hoisted(() => ({
  mockRouter: {
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
  },
  hooks: {
    useCreateFeeType: vi.fn(),
    useCreateProperty: vi.fn(),
    useDeleteProperty: vi.fn(),
    useDeletePropertyImage: vi.fn(),
    useDeletePropertyVideo: vi.fn(),
    useFeeTypes: vi.fn(),
    useLocations: vi.fn(),
    useManageProperty: vi.fn(),
    useMyAgent: vi.fn(),
    usePublishProperty: vi.fn(),
    usePropertyAuthorityOptions: vi.fn(),
    usePropertyTypes: vi.fn(),
    useReorderPropertyImages: vi.fn(),
    useUpdateProperty: vi.fn(),
    useUploadPropertyImage: vi.fn(),
    useUploadPropertyVideo: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/hooks", () => hooks);

const updatePropertyMutateAsync = vi.fn();
const createPropertyMutateAsync = vi.fn();
const publishPropertyMutateAsync = vi.fn();
const deletePropertyMutateAsync = vi.fn();
const uploadPropertyImageMutateAsync = vi.fn();
const uploadPropertyVideoMutateAsync = vi.fn();
const reorderPropertyImagesMutateAsync = vi.fn();
const deletePropertyImageMutateAsync = vi.fn();
const deletePropertyVideoMutateAsync = vi.fn();
const createFeeTypeMutateAsync = vi.fn();

const baseProperty = {
  id: "draft-1",
  title: "Modern 3-bedroom apartment in Lekki Phase 1",
  description:
    "A bright apartment with parking, treated water, fitted kitchen, nearby shops, dependable estate power, secure access control, generous bedroom storage, and quick access to work hubs, schools, restaurants, and everyday essentials for families and professionals.",
  area: "Lekki Phase 1",
  address_line: "14 Admiralty Way, Lekki Phase 1",
  property_type: "apartment",
  listing_purpose: "rent",
  bedrooms: 3,
  bathrooms: 3,
  rent_amount: 8500000,
  asking_price: null,
  agency_fee: 850000,
  listing_authority_mode: "owner_agent",
  declared_commission_share_percent: null,
  referral_basis_summary: {
    basis_source_label: "agency fee",
    public_commission_basis_amount: 850000,
    declared_agent_share_percent: null,
    eligible_referral_basis_amount: 850000,
    referral_eligibility_status: "eligible",
    publish_blocker: null,
    uses_declared_share: false,
  },
  application_mode: "message_agent",
  status: "draft",
  images: [
    {
      id: "image-1",
      image_url: "https://example.com/image-1.jpg",
      is_cover: true,
    },
    {
      id: "image-2",
      image_url: "https://example.com/image-2.jpg",
      is_cover: false,
    },
    {
      id: "image-3",
      image_url: "https://example.com/image-3.jpg",
      is_cover: false,
    },
    {
      id: "image-4",
      image_url: "https://example.com/image-4.jpg",
      is_cover: false,
    },
    {
      id: "image-5",
      image_url: "https://example.com/image-5.jpg",
      is_cover: false,
    },
  ],
  property_images: [
    {
      id: "image-1",
      image_url: "https://example.com/image-1.jpg",
      is_cover: true,
    },
  ],
  property_videos: [],
  property_fees: [
    {
      id: "fee-1",
      property_id: "draft-1",
      fee_type_id: "agency-fee-type",
      value_type: "fixed",
      amount: 850000,
      percentage: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      fee_type: {
        id: "agency-fee-type",
        name: "Agency Fee",
        slug: "agency_fee",
        description: null,
      },
    },
  ],
  completion: {
    ready_to_publish: true,
    blockers: [],
    completed_count: 10,
    total_count: 10,
    progress_percentage: 100,
    checklist: [
      { key: "title", label: "Title added", completed: true },
      { key: "description", label: "Description added", completed: true },
      { key: "location", label: "Location added", completed: true },
      { key: "price", label: "Pricing added", completed: true },
      { key: "photos", label: "Five photos uploaded", completed: true },
      { key: "address", label: "Address added", completed: true },
      { key: "rooms", label: "Room count added", completed: true },
      { key: "listing_authority", label: "Authority chosen", completed: true },
      { key: "commission_share", label: "Share declared", completed: true },
      { key: "commission_basis", label: "Basis complete", completed: true },
    ],
  },
};

class MockFileReader {
  public result: string | ArrayBuffer | null = null;
  public onload: null | (() => void) = null;
  public onerror: null | (() => void) = null;
  public error: DOMException | null = null;

  readAsDataURL(file: File) {
    this.result = `data:${file.type};base64,ZmFrZQ==`;
    this.onload?.();
  }
}

describe("PropertyComposer", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function close() {
      this.open = false;
    });

    useAuthStore.setState({
      user: {
        id: "user-1",
        email: "agent@renyt.ng",
        full_name: "Agent Test",
        phone: "+2340000000000",
        avatar_url: null,
        avatar_review_status: "pending",
        avatar_review_note: null,
        role: "agent",
        created_at: "2025-01-01T00:00:00Z",
      },
      isAuthenticated: true,
      isLoading: false,
    });

    mockRouter.replace.mockReset();
    mockRouter.push.mockReset();
    mockRouter.refresh.mockReset();

    updatePropertyMutateAsync.mockReset();
    createPropertyMutateAsync.mockReset();
    publishPropertyMutateAsync.mockReset();
    deletePropertyMutateAsync.mockReset();
    uploadPropertyImageMutateAsync.mockReset();
    uploadPropertyVideoMutateAsync.mockReset();
    reorderPropertyImagesMutateAsync.mockReset();
    deletePropertyImageMutateAsync.mockReset();
    deletePropertyVideoMutateAsync.mockReset();
    createFeeTypeMutateAsync.mockReset();
    window.scrollTo = vi.fn();

    hooks.useMyAgent.mockReturnValue({
      data: { data: { verification_status: "approved" } },
    });
    hooks.useManageProperty.mockReturnValue({
      data: { data: baseProperty },
      isLoading: false,
    });
    hooks.usePropertyTypes.mockReturnValue({
      data: { data: [{ slug: "apartment", label: "Apartment" }] },
    });
    hooks.usePropertyAuthorityOptions.mockReturnValue({
      data: {
        data: {
          options: [
            {
              value: "owner_agent",
              label: "Owner agent",
              description: "Controls the commission side.",
              requires_share: false,
            },
            {
              value: "authorized_listing_agent",
              label: "Authorized listing agent",
              description: "Receives only a share.",
              requires_share: true,
            },
          ],
          share_range: {
            min: 0.01,
            max: 100,
          },
        },
      },
    });
    hooks.useFeeTypes.mockReturnValue({
      data: {
        data: [
          {
            id: "agency-fee-type",
            name: "Agency Fee",
            slug: "agency_fee",
            description: null,
            supports_fixed: true,
            supports_percentage: true,
            is_active: true,
            created_by: null,
            created_at: "2025-01-01T00:00:00Z",
          },
        ],
      },
    });
    hooks.useLocations.mockReturnValue({
      data: { data: [{ name: "Lekki Phase 1", display_name: "Lekki Phase 1" }] },
    });
    hooks.useCreateProperty.mockReturnValue({
      mutateAsync: createPropertyMutateAsync,
      isPending: false,
    });
    hooks.useUpdateProperty.mockReturnValue({
      mutateAsync: updatePropertyMutateAsync,
      isPending: false,
    });
    hooks.usePublishProperty.mockReturnValue({
      mutateAsync: publishPropertyMutateAsync,
      isPending: false,
    });
    hooks.useDeleteProperty.mockReturnValue({
      mutateAsync: deletePropertyMutateAsync,
      isPending: false,
    });
    hooks.useCreateFeeType.mockReturnValue({
      mutateAsync: createFeeTypeMutateAsync,
      isPending: false,
    });
    hooks.useUploadPropertyImage.mockReturnValue({
      mutateAsync: uploadPropertyImageMutateAsync,
      isPending: false,
    });
    hooks.useUploadPropertyVideo.mockReturnValue({
      mutateAsync: uploadPropertyVideoMutateAsync,
      isPending: false,
    });
    hooks.useReorderPropertyImages.mockReturnValue({
      mutateAsync: reorderPropertyImagesMutateAsync,
      isPending: false,
    });
    hooks.useDeletePropertyImage.mockReturnValue({
      mutateAsync: deletePropertyImageMutateAsync,
      isPending: false,
    });
    hooks.useDeletePropertyVideo.mockReturnValue({
      mutateAsync: deletePropertyVideoMutateAsync,
      isPending: false,
    });

    updatePropertyMutateAsync.mockResolvedValue({ data: baseProperty });
    createPropertyMutateAsync.mockResolvedValue({ data: baseProperty });
    publishPropertyMutateAsync.mockResolvedValue({ success: true });
    deletePropertyMutateAsync.mockResolvedValue({ success: true });
    uploadPropertyImageMutateAsync.mockResolvedValue({
      data: {
        id: "image-uploaded",
        property_id: "draft-1",
        image_url: "https://example.com/image-uploaded.jpg",
        storage_path: "images/draft-1/image-uploaded.jpg",
        file_name: "image-uploaded.jpg",
        mime_type: "image/jpeg",
        display_order: 5,
        is_cover: false,
        created_at: "2025-01-01T00:00:00Z",
      },
    });
    uploadPropertyVideoMutateAsync.mockResolvedValue({
      data: {
        id: "video-1",
        property_id: "draft-1",
        video_url: "https://example.com/video-1.mp4",
        storage_path: "videos/draft-1/video-1.mp4",
        file_name: "video-1.mp4",
        mime_type: "video/mp4",
        created_at: "2025-01-01T00:00:00Z",
      },
    });
    reorderPropertyImagesMutateAsync.mockResolvedValue({ success: true });
    deletePropertyImageMutateAsync.mockResolvedValue({ success: true });
    deletePropertyVideoMutateAsync.mockResolvedValue({ success: true });

    vi.stubGlobal("FileReader", MockFileReader as unknown as typeof FileReader);
    window.history.replaceState({}, "", "/dashboard/properties/draft-1/edit");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restores the requested composer step from the URL", async () => {
    window.history.replaceState({}, "", "/dashboard/properties/draft-1/edit?step=media");

    render(<PropertyComposer propertyId="draft-1" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Media" })).toBeInTheDocument();
    });
  });

  it("moves to media immediately while preserving the fast path for an unchanged draft", async () => {
    window.history.replaceState({}, "", "/dashboard/properties/draft-1/edit?step=pricing");

    render(<PropertyComposer propertyId="draft-1" />);

    expect(await screen.findByRole("heading", { name: "Pricing Breakdown" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Media" })).toBeInTheDocument();
    expect(updatePropertyMutateAsync).not.toHaveBeenCalled();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("publishes immediately without a redundant save when the draft is already current", async () => {
    const deferred = createDeferred<{ success: true }>();
    publishPropertyMutateAsync.mockReturnValueOnce(deferred.promise);
    window.history.replaceState({}, "", "/dashboard/properties/draft-1/edit?step=review");

    render(<PropertyComposer propertyId="draft-1" />);

    const publishButton = await screen.findByRole("button", { name: "Publish Listing" });
    fireEvent.click(publishButton);

    expect(publishButton).toBeDisabled();
    await waitFor(() => expect(publishPropertyMutateAsync).toHaveBeenCalledWith("draft-1"));
    expect(updatePropertyMutateAsync).not.toHaveBeenCalled();

    deferred.resolve({ success: true });
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/properties?publishing=draft-1"));
  });

  it("deletes a draft after confirmation", async () => {
    render(<PropertyComposer propertyId="draft-1" />);

    fireEvent.click(await screen.findByRole("button", { name: "Delete Draft" }));
    const dialog = await screen.findByRole("dialog", { name: /Delete property draft/i });
    expect(within(dialog).getByText(/Delete this draft permanently/i)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /^Delete draft$/i }));

    await waitFor(() => expect(deletePropertyMutateAsync).toHaveBeenCalledWith("draft-1"));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/properties"));
  });

  it("saves authorized listing authority and commission share in the draft payload", async () => {
    window.history.replaceState({}, "", "/dashboard/properties/draft-1/edit?step=review");

    render(<PropertyComposer propertyId="draft-1" />);

    fireEvent.click(await screen.findByRole("radio", { name: /Authorized listing agent/i }));

    const shareInput = screen.getByLabelText("Your Commission Share (%)");
    fireEvent.change(shareInput, { target: { value: "40" } });

    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));

    await waitFor(() => {
      expect(updatePropertyMutateAsync).toHaveBeenCalledWith({
        id: "draft-1",
        data: expect.objectContaining({
          agency_fee: 850000,
          listing_authority_mode: "authorized_listing_agent",
          declared_commission_share_percent: 40,
        }),
      });
    });

    expect(screen.getByText(/Eligible referral basis/i)).toBeInTheDocument();
    expect(screen.getAllByText(/₦340,000/).length).toBeGreaterThan(0);
  });

  it("shows sale listings can keep fee lines in pricing", async () => {
    render(<PropertyComposer propertyId="draft-1" />);

    const listingPurpose = await screen.findByLabelText("Listing Purpose");
    fireEvent.click(listingPurpose);
    fireEvent.click(screen.getByRole("option", { name: "For Sale" }));

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText(/full purchase cost upfront/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Fee/i })).toBeInTheDocument();
  });

  it("uploads dropped images from the media dropzone", async () => {
    window.history.replaceState({}, "", "/dashboard/properties/draft-1/edit?step=media");

    render(<PropertyComposer propertyId="draft-1" />);

    const imageDropzone = await screen.findByRole("button", {
      name: "Upload property photos",
    });
    const file = new File(["photo"], "living-room.jpg", { type: "image/jpeg" });

    fireEvent.drop(imageDropzone, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(uploadPropertyImageMutateAsync).toHaveBeenCalledWith({
        id: "draft-1",
        data: {
          file_name: "living-room.jpg",
          content_type: "image/jpeg",
          base64_data: "ZmFrZQ==",
        },
      });
    });
  });

  it("uploads dropped video files from the walkthrough video card", async () => {
    window.history.replaceState({}, "", "/dashboard/properties/draft-1/edit?step=media");

    render(<PropertyComposer propertyId="draft-1" />);

    const videoDropzoneCopy = await screen.findByText(
      "Drag and drop a walkthrough video anywhere in this card or click Upload Video.",
    );
    const file = new File(["video"], "tour.mp4", { type: "video/mp4" });

    fireEvent.drop(videoDropzoneCopy.closest("div.rounded-3xl")!, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(uploadPropertyVideoMutateAsync).toHaveBeenCalledWith({
        id: "draft-1",
        data: {
          file_name: "tour.mp4",
          content_type: "video/mp4",
          base64_data: "ZmFrZQ==",
        },
      });
    });
  });

  it("reorders photos by drag and marks the first position as cover", async () => {
    window.history.replaceState({}, "", "/dashboard/properties/draft-1/edit?step=media");

    render(<PropertyComposer propertyId="draft-1" />);

    const draggedPhoto = await screen.findByAltText("Property image 3");
    const firstPhoto = screen.getByAltText("Property image 1");

    fireEvent.dragStart(draggedPhoto.closest("div[draggable='true']")!);
    fireEvent.dragOver(firstPhoto.closest("div[draggable='true']")!);
    fireEvent.drop(firstPhoto.closest("div[draggable='true']")!);

    await waitFor(() => {
      expect(reorderPropertyImagesMutateAsync).toHaveBeenCalledWith({
        id: "draft-1",
        imageIds: ["image-3", "image-1", "image-2", "image-4", "image-5"],
      });
    });

    const coverBadges = screen.getAllByText("Cover");
    expect(coverBadges).toHaveLength(1);
    expect(screen.getAllByText(/Photo /)[0]).toHaveTextContent("Photo 1");
  });

  it("removes an image from the grid immediately before the delete request resolves", async () => {
    const deferred = createDeferred<{ success: true }>();
    deletePropertyImageMutateAsync.mockReturnValueOnce(deferred.promise);
    window.history.replaceState({}, "", "/dashboard/properties/draft-1/edit?step=media");

    render(<PropertyComposer propertyId="draft-1" />);

    expect(await screen.findByAltText("Property image 5")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Remove/ })[0]);

    await waitFor(() => {
      expect(document.querySelector('img[src="https://example.com/image-1.jpg"]')).toBeNull();
    });

    deferred.resolve({ success: true });
    await waitFor(() => expect(deletePropertyImageMutateAsync).toHaveBeenCalled());
  });
});
