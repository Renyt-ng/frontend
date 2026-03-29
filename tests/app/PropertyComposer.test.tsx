import type { ReactNode } from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    useDeletePropertyImage: vi.fn(),
    useDeletePropertyVideo: vi.fn(),
    useFeeTypes: vi.fn(),
    useLocations: vi.fn(),
    useManageProperty: vi.fn(),
    useMyAgent: vi.fn(),
    usePublishProperty: vi.fn(),
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
    "A bright apartment with parking, treated water, fitted kitchen, nearby shops, and reliable power for everyday comfort.",
  area: "Lekki Phase 1",
  address_line: "14 Admiralty Way, Lekki Phase 1",
  property_type: "apartment",
  listing_purpose: "rent",
  bedrooms: 3,
  bathrooms: 3,
  rent_amount: 8500000,
  asking_price: null,
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
  property_fees: [],
  completion: {
    ready_to_publish: true,
    blockers: [],
    completed_count: 7,
    total_count: 7,
    progress_percentage: 100,
    checklist: [
      { key: "title", label: "Title added", completed: true },
      { key: "description", label: "Description added", completed: true },
      { key: "location", label: "Location added", completed: true },
      { key: "price", label: "Pricing added", completed: true },
      { key: "photos", label: "Five photos uploaded", completed: true },
      { key: "address", label: "Address added", completed: true },
      { key: "rooms", label: "Room count added", completed: true },
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
    uploadPropertyImageMutateAsync.mockReset();
    uploadPropertyVideoMutateAsync.mockReset();
    reorderPropertyImagesMutateAsync.mockReset();
    deletePropertyImageMutateAsync.mockReset();
    deletePropertyVideoMutateAsync.mockReset();
    createFeeTypeMutateAsync.mockReset();

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
    hooks.useFeeTypes.mockReturnValue({ data: { data: [] } });
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

  it("moves to media immediately while an existing draft save is still running", async () => {
    const deferred = createDeferred<{ data: typeof baseProperty }>();
    updatePropertyMutateAsync.mockReturnValueOnce(deferred.promise);
    window.history.replaceState({}, "", "/dashboard/properties/draft-1/edit?step=pricing");

    render(<PropertyComposer propertyId="draft-1" />);

    expect(await screen.findByRole("heading", { name: "Pricing Breakdown" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Media" })).toBeInTheDocument();
    expect(updatePropertyMutateAsync).toHaveBeenCalledTimes(1);

    deferred.resolve({ data: baseProperty });
    await waitFor(() => expect(updatePropertyMutateAsync).toHaveBeenCalledTimes(1));
  });

  it("shows publish loading immediately before the publish mutation starts", async () => {
    const deferred = createDeferred<{ data: typeof baseProperty }>();
    updatePropertyMutateAsync.mockReturnValueOnce(deferred.promise);
    window.history.replaceState({}, "", "/dashboard/properties/draft-1/edit?step=review");

    render(<PropertyComposer propertyId="draft-1" />);

    const publishButton = await screen.findByRole("button", { name: "Publish Listing" });
    fireEvent.click(publishButton);

    expect(publishButton).toBeDisabled();
    expect(publishButton.querySelector("svg.animate-spin")).toBeTruthy();
    expect(publishPropertyMutateAsync).not.toHaveBeenCalled();

    deferred.resolve({ data: baseProperty });

    await waitFor(() => expect(publishPropertyMutateAsync).toHaveBeenCalledWith("draft-1"));
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
