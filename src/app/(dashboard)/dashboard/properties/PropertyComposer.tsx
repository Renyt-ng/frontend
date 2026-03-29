"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  ImagePlus,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { Button, Card, CardContent, Input, NumericInput, Select } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import {
  useCreateFeeType,
  useCreateProperty,
  useDeletePropertyImage,
  useDeletePropertyVideo,
  useFeeTypes,
  useLocations,
  useManageProperty,
  useMyAgent,
  usePublishProperty,
  usePropertyTypes,
  useReorderPropertyImages,
  useUpdateProperty,
  useUploadPropertyImage,
  useUploadPropertyVideo,
} from "@/lib/hooks";
import {
  buildDraftChecklist,
  buildDraftPricingSummary,
  formatListingPurpose,
  formatPropertyPriceLabel,
  formatPropertyType,
  formatCurrency,
} from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type {
  CreatePropertyInput,
  FeeType,
  PropertyFeeInput,
  PropertyImage,
  PropertyListingPurpose,
  PropertyStatus,
  PropertyType,
  PropertyVideo,
} from "@/types";

type ComposerStep = "basics" | "pricing" | "media" | "review";
type SaveState = "idle" | "saving" | "saved" | "error";

interface PropertyComposerProps {
  propertyId?: string;
}

interface ComposerValues {
  title: string;
  description: string;
  area: string;
  address_line: string;
  property_type: PropertyType;
  listing_purpose: PropertyListingPurpose;
  bedrooms: number | null;
  bathrooms: number | null;
  rent_amount: number | null;
  asking_price: number | null;
  application_mode: "instant_apply" | "message_agent";
  fees: PropertyFeeInput[];
}

const stepOrder: ComposerStep[] = ["basics", "pricing", "media", "review"];

const listingPurposeOptions = [
  { value: "rent", label: "For Rent" },
  { value: "sale", label: "For Sale" },
];

const applicationModeOptions = [
  { value: "instant_apply", label: "Instant Apply + Message Agent" },
  { value: "message_agent", label: "Message Agent" },
];

const defaultValues: ComposerValues = {
  title: "",
  description: "",
  area: "",
  address_line: "",
  property_type: "apartment",
  listing_purpose: "rent",
  bedrooms: 1,
  bathrooms: 1,
  rent_amount: null,
  asking_price: null,
  application_mode: "message_agent",
  fees: [],
};

function parseComposerStep(stepParam: string | null | undefined): ComposerStep {
  if (stepParam && stepOrder.includes(stepParam as ComposerStep)) {
    return stepParam as ComposerStep;
  }

  return "basics";
}

function syncComposerStepInUrl(nextStep: ComposerStep) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  if (nextStep === "basics") {
    url.searchParams.delete("step");
  } else {
    url.searchParams.set("step", nextStep);
  }

  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }

      resolve(reader.result.split(",")[1] ?? reader.result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function serializeValues(values: ComposerValues) {
  return JSON.stringify(values);
}

function normalizeComposerImages(images: PropertyImage[]) {
  return images.map((image, index) => ({
    ...image,
    display_order: index,
    is_cover: index === 0,
  }));
}

function moveImageToIndex(images: PropertyImage[], fromIndex: number, toIndex: number) {
  const reordered = [...images];
  const [movedImage] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, movedImage);
  return normalizeComposerImages(reordered);
}

export function PropertyComposer({ propertyId }: PropertyComposerProps) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const myAgentQuery = useMyAgent({ enabled: user?.role === "agent", retry: false });
  const managePropertyQuery = useManageProperty(propertyId ?? "", {
    enabled: Boolean(propertyId),
  });
  const propertyTypesQuery = usePropertyTypes();
  const feeTypesQuery = useFeeTypes();
  const locationsQuery = useLocations({ kind: "all", limit: 40 });
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const publishProperty = usePublishProperty();
  const createFeeType = useCreateFeeType();
  const uploadImage = useUploadPropertyImage();
  const reorderImages = useReorderPropertyImages();
  const deleteImage = useDeletePropertyImage();
  const uploadVideo = useUploadPropertyVideo();
  const deleteVideo = useDeletePropertyVideo();

  const [step, setStep] = useState<ComposerStep>("basics");
  const [values, setValues] = useState<ComposerValues>(defaultValues);
  const [draftId, setDraftId] = useState<string | undefined>(propertyId);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [serverError, setServerError] = useState("");
  const [publishError, setPublishError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showFeeTypeCreator, setShowFeeTypeCreator] = useState(false);
  const [newFeeTypeName, setNewFeeTypeName] = useState("");
  const [newFeeTypeDescription, setNewFeeTypeDescription] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [continuingToMedia, setContinuingToMedia] = useState(false);
  const [publishingListing, setPublishingListing] = useState(false);
  const [isImageDropActive, setIsImageDropActive] = useState(false);
  const [isVideoDropActive, setIsVideoDropActive] = useState(false);
  const [imageItems, setImageItems] = useState<PropertyImage[]>([]);
  const [videoItems, setVideoItems] = useState<PropertyVideo[]>([]);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dropTargetImageId, setDropTargetImageId] = useState<string | null>(null);
  const [reorderingImages, setReorderingImages] = useState(false);
  const [removingImageIds, setRemovingImageIds] = useState<string[]>([]);
  const [removingVideoId, setRemovingVideoId] = useState<string | null>(null);

  const hydratedProperty = managePropertyQuery.data?.data;
  const lastSavedSnapshot = useRef<string>(serializeValues(defaultValues));
  const initializedRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setStep(parseComposerStep(new URLSearchParams(window.location.search).get("step")));
  }, []);

  useEffect(() => {
    if (!hydratedProperty || initializedRef.current) {
      return;
    }

    const initialValues: ComposerValues = {
      title: hydratedProperty.title,
      description: hydratedProperty.description,
      area: hydratedProperty.area,
      address_line: hydratedProperty.address_line,
      property_type: hydratedProperty.property_type,
      listing_purpose: hydratedProperty.listing_purpose,
      bedrooms: hydratedProperty.bedrooms,
      bathrooms: hydratedProperty.bathrooms,
      rent_amount: hydratedProperty.rent_amount,
      asking_price: hydratedProperty.asking_price,
      application_mode: hydratedProperty.application_mode,
      fees: (hydratedProperty.property_fees ?? []).map((fee) => ({
        fee_type_id: fee.fee_type_id,
        label: fee.label,
        value_type: fee.value_type,
        amount: fee.amount,
        percentage: fee.percentage,
        display_order: fee.display_order,
      })),
    };

    setValues(initialValues);
    setDraftId(hydratedProperty.id);
    lastSavedSnapshot.current = serializeValues(initialValues);
    initializedRef.current = true;
  }, [hydratedProperty]);

  useEffect(() => {
    setImageItems(normalizeComposerImages(hydratedProperty?.images ?? hydratedProperty?.property_images ?? []));
    setVideoItems(hydratedProperty?.property_videos ?? []);
  }, [hydratedProperty?.images, hydratedProperty?.property_images, hydratedProperty?.property_videos]);

  useEffect(() => {
    if (!draftId || !initializedRef.current) {
      return;
    }

    const snapshot = serializeValues(values);
    if (snapshot === lastSavedSnapshot.current) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setSaveState("saving");
        await updateProperty.mutateAsync({
          id: draftId,
          data: buildPayload(values),
        });
        lastSavedSnapshot.current = serializeValues(values);
        setSaveState("saved");
        setServerError("");
      } catch (error) {
        setSaveState("error");
        setServerError(getApiErrorMessage(error, "Could not save draft"));
      }
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [draftId, updateProperty, values]);

  const agentProfile = myAgentQuery.data?.data ?? null;
  const agentStatus = agentProfile?.verification_status;
  const needsAgentApplication = user?.role === "agent" && !agentProfile;
  const agentApprovalPending =
    user?.role === "agent" &&
    agentProfile &&
    agentProfile.verification_status !== "approved";

  const checklist = useMemo(() => {
    if (hydratedProperty?.completion) {
      return hydratedProperty.completion;
    }

    return buildDraftChecklist({
      title: values.title,
      description: values.description,
      area: values.area,
      address_line: values.address_line,
      property_type: values.property_type,
      listing_purpose: values.listing_purpose,
      bedrooms: values.bedrooms ?? -1,
      bathrooms: values.bathrooms ?? -1,
      rent_amount: values.rent_amount ?? 0,
      asking_price: values.asking_price ?? 0,
      imageCount: imageItems.length,
    });
  }, [hydratedProperty?.completion, imageItems.length, values]);

  const pricingSummary = useMemo(
    () => buildDraftPricingSummary(values.rent_amount ?? 0, values.asking_price ?? 0, values.fees),
    [values.asking_price, values.fees, values.rent_amount],
  );

  const currentStepIndex = stepOrder.indexOf(step);
  const draftStatus = (hydratedProperty?.status ?? "draft") as PropertyStatus;
  const feeTypeOptions = (feeTypesQuery.data?.data ?? []).map((feeType) => ({
    value: feeType.id,
    label: feeType.name,
  }));
  const propertyTypeOptions = (propertyTypesQuery.data?.data ?? []).map((propertyType) => ({
    value: propertyType.slug,
    label: propertyType.label,
  }));
  const areaOptions = useMemo(() => {
    const options = (locationsQuery.data?.data ?? []).map((location) => ({
      value: location.name,
      label: location.display_name,
    }));

    if (values.area && !options.some((option) => option.value === values.area)) {
      return [{ value: values.area, label: values.area }, ...options];
    }

    return options;
  }, [locationsQuery.data?.data, values.area]);

  function updateField<K extends keyof ComposerValues>(key: K, value: ComposerValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateStep(nextStep: ComposerStep) {
    setStep(nextStep);
    syncComposerStepInUrl(nextStep);
  }

  function updateFee(index: number, patch: Partial<PropertyFeeInput>) {
    setValues((current) => ({
      ...current,
      fees: current.fees.map((fee, feeIndex) =>
        feeIndex === index ? { ...fee, ...patch } : fee,
      ),
    }));
  }

  function addFee() {
    const firstFeeType = feeTypesQuery.data?.data?.[0];
    if (!firstFeeType) {
      return;
    }

    setValues((current) => ({
      ...current,
      fees: [
        ...current.fees,
        {
          fee_type_id: firstFeeType.id,
          label: firstFeeType.name,
          value_type: firstFeeType.supports_fixed ? "fixed" : "percentage",
          amount: firstFeeType.supports_fixed ? null : null,
          percentage: firstFeeType.supports_fixed ? null : null,
          display_order: current.fees.length,
        },
      ],
    }));
  }

  function removeFee(index: number) {
    setValues((current) => ({
      ...current,
      fees: current.fees
        .filter((_, feeIndex) => feeIndex !== index)
        .map((fee, feeIndex) => ({ ...fee, display_order: feeIndex })),
    }));
  }

  function validateBasics() {
    const errors: Record<string, string> = {};

    if (values.title.trim().length < 5) errors.title = "Title must be at least 5 characters";
    if (values.description.trim().length < 20) {
      errors.description = "Description must be at least 20 characters";
    }
    if (!values.area.trim()) errors.area = "Select an area";
    if (values.address_line.trim().length < 5) {
      errors.address_line = "Address must be at least 5 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validatePricing() {
    const errors: Record<string, string> = {};

    if (values.listing_purpose === "sale") {
      if ((values.asking_price ?? 0) <= 0) {
        errors.asking_price = "Asking price must be greater than 0";
      }
    } else if ((values.rent_amount ?? 0) <= 0) {
      errors.rent_amount = "Annual rent must be greater than 0";
    }

    if (values.listing_purpose === "rent") {
      values.fees.forEach((fee, index) => {
        if (fee.value_type === "fixed" && fee.amount != null && fee.amount < 0) {
          errors[`fee-${index}`] = "Fixed fees cannot be negative";
        }
        if (fee.value_type === "percentage" && fee.percentage != null && fee.percentage < 0) {
          errors[`fee-${index}`] = "Percentage fees cannot be negative";
        }
      });
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function ensureDraftSaved(nextStep?: ComposerStep) {
    const payload = buildPayload(values);
    setServerError("");
    setSaveState("saving");

    if (!draftId) {
      const response = await createProperty.mutateAsync(payload);
      const property = response.data;
      setDraftId(property.id);
      initializedRef.current = true;
      lastSavedSnapshot.current = serializeValues(values);
      setSaveState("saved");
      startTransition(() => {
        const targetStep = nextStep ?? step;
        const stepQuery = targetStep === "basics" ? "" : `?step=${targetStep}`;
        router.replace(`/dashboard/properties/${property.id}/edit${stepQuery}`);
      });
      return property.id;
    }

    await updateProperty.mutateAsync({ id: draftId, data: payload });
    lastSavedSnapshot.current = serializeValues(values);
    setSaveState("saved");
    return draftId;
  }

  async function handleContinue() {
    setPublishError("");
    setServerError("");

    try {
      if (step === "basics") {
        if (!validateBasics()) {
          return;
        }

        updateStep("pricing");
        return;
      }

      if (step === "pricing") {
        if (!validateBasics() || !validatePricing()) {
          return;
        }

        setContinuingToMedia(true);

        if (draftId) {
          updateStep("media");
          void ensureDraftSaved("media").catch((error) => {
            setSaveState("error");
            setServerError(getApiErrorMessage(error, "Could not save draft"));
          }).finally(() => {
            setContinuingToMedia(false);
          });
          return;
        }

        await ensureDraftSaved("media");
        updateStep("media");
        setContinuingToMedia(false);
        return;
      }

      if (step === "media") {
        updateStep("review");
      }
    } catch (error) {
      setContinuingToMedia(false);
      setSaveState("error");
      setServerError(getApiErrorMessage(error, "Could not save draft"));
    }
  }

  async function handleSaveDraft() {
    try {
      if (!validateBasics() || !validatePricing()) {
        return;
      }

      await ensureDraftSaved();
    } catch (error) {
      setSaveState("error");
      setServerError(getApiErrorMessage(error, "Could not save draft"));
    }
  }

  async function handleCreateFeeType() {
    try {
      if (!newFeeTypeName.trim()) {
        return;
      }

      const response = await createFeeType.mutateAsync({
        name: newFeeTypeName.trim(),
        description: newFeeTypeDescription.trim() || null,
        supports_fixed: true,
        supports_percentage: true,
      });

      const created = response.data;
      setShowFeeTypeCreator(false);
      setNewFeeTypeName("");
      setNewFeeTypeDescription("");
      setValues((current) => ({
        ...current,
        fees: [
          ...current.fees,
          {
            fee_type_id: created.id,
            label: created.name,
            value_type: "fixed",
            amount: null,
            display_order: current.fees.length,
          },
        ],
      }));
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Could not create fee type"));
    }
  }

  async function uploadImageFiles(files: File[]) {
    if (!draftId || files.length === 0) {
      return;
    }

    setUploadingImages(true);
    setServerError("");

    try {
      for (const file of files) {
        const base64_data = await fileToBase64(file);
        const response = await uploadImage.mutateAsync({
          id: draftId,
          data: {
            file_name: file.name,
            content_type: file.type,
            base64_data,
          },
        });

        setImageItems((current) => normalizeComposerImages([...current, response.data]));
      }
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Could not upload images"));
    } finally {
      setUploadingImages(false);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    await uploadImageFiles(files);
    event.target.value = "";
  }

  async function uploadVideoFile(file: File | null | undefined) {
    if (!draftId || !file) {
      return;
    }

    setUploadingVideo(true);
    setServerError("");

    try {
      const base64_data = await fileToBase64(file);
      const response = await uploadVideo.mutateAsync({
        id: draftId,
        data: {
          file_name: file.name,
          content_type: file.type,
          base64_data,
        },
      });
      setVideoItems([response.data]);
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Could not upload video"));
    } finally {
      setUploadingVideo(false);
    }
  }

  async function handleVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    await uploadVideoFile(file);
    event.target.value = "";
  }

  async function handleImageDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsImageDropActive(false);
    const files = Array.from(event.dataTransfer.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    await uploadImageFiles(files);
  }

  async function handleVideoDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsVideoDropActive(false);
    const file = Array.from(event.dataTransfer.files ?? []).find((item) =>
      item.type.startsWith("video/"),
    );
    await uploadVideoFile(file);
  }

  async function moveImage(imageId: string, direction: "up" | "down") {
    if (!draftId) {
      return;
    }

    const currentIndex = imageItems.findIndex((image) => image.id === imageId);
    if (currentIndex === -1) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= imageItems.length) {
      return;
    }

    const reordered = moveImageToIndex(imageItems, currentIndex, targetIndex);
    const previousImages = imageItems;
    setImageItems(reordered);
    setReorderingImages(true);

    try {
      await reorderImages.mutateAsync({
        id: draftId,
        imageIds: reordered.map((image) => image.id),
      });
    } catch (error) {
      setImageItems(previousImages);
      setServerError(getApiErrorMessage(error, "Could not reorder images"));
    } finally {
      setReorderingImages(false);
    }
  }

  async function reorderImagesByDrag(sourceImageId: string, targetImageId: string) {
    if (!draftId || sourceImageId === targetImageId) {
      return;
    }

    const sourceIndex = imageItems.findIndex((image) => image.id === sourceImageId);
    const targetIndex = imageItems.findIndex((image) => image.id === targetImageId);
    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const reordered = moveImageToIndex(imageItems, sourceIndex, targetIndex);
    const previousImages = imageItems;
    setImageItems(reordered);
    setReorderingImages(true);
    setDraggedImageId(null);
    setDropTargetImageId(null);

    try {
      await reorderImages.mutateAsync({
        id: draftId,
        imageIds: reordered.map((image) => image.id),
      });
    } catch (error) {
      setImageItems(previousImages);
      setServerError(getApiErrorMessage(error, "Could not reorder images"));
    } finally {
      setReorderingImages(false);
    }
  }

  async function handleRemoveImage(imageId: string) {
    if (!draftId) {
      return;
    }

    const previousImages = imageItems;
    setRemovingImageIds((current) => [...current, imageId]);
    setImageItems((current) => normalizeComposerImages(current.filter((image) => image.id !== imageId)));

    try {
      await deleteImage.mutateAsync({ id: draftId, imageId });
    } catch (error) {
      setImageItems(previousImages);
      setServerError(getApiErrorMessage(error, "Could not remove image"));
    } finally {
      setRemovingImageIds((current) => current.filter((currentId) => currentId !== imageId));
    }
  }

  async function handleRemoveVideo(videoId: string) {
    if (!draftId) {
      return;
    }

    const previousVideos = videoItems;
    setRemovingVideoId(videoId);
    setVideoItems([]);

    try {
      await deleteVideo.mutateAsync({ id: draftId, videoId });
    } catch (error) {
      setVideoItems(previousVideos);
      setServerError(getApiErrorMessage(error, "Could not remove video"));
    } finally {
      setRemovingVideoId(null);
    }
  }

  async function handlePublish() {
    if (!draftId) {
      return;
    }

    setPublishError("");
    setPublishingListing(true);

    try {
      const propertyId = await ensureDraftSaved("review");
      await publishProperty.mutateAsync(propertyId);
      startTransition(() => {
        router.push(`/dashboard/properties?publishing=${propertyId}`);
      });
    } catch (error) {
      setPublishingListing(false);
      setPublishError(getApiErrorMessage(error, "Could not publish listing"));
    }
  }

  function handleStepClick(nextStep: ComposerStep) {
    const nextIndex = stepOrder.indexOf(nextStep);
    if (nextIndex <= currentStepIndex) {
      updateStep(nextStep);
    }
  }

  if (isLoading || (propertyId && managePropertyQuery.isLoading)) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-[640px] animate-pulse rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (user?.role !== "agent" && user?.role !== "admin") {
    return (
      <AccessCard
        title="Agent Or Admin Access Required"
        description="Only agent or admin accounts can access the listing composer."
      />
    );
  }

  if (needsAgentApplication || agentApprovalPending) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="space-y-5 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-[var(--color-pending)]">
            <CircleAlert className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Complete Agent Verification First
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
              Listings can only be created and published by approved agents.
            </p>
          </div>
          {agentStatus && (
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3">
              <span className="text-sm text-[var(--color-text-secondary)]">Current status:</span>
              <StatusBadge status={agentStatus} size="sm" />
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/agent-verification">
              <Button>Review Verification Setup</Button>
            </Link>
            <Link href="/dashboard/properties">
              <Button variant="secondary">Back to My Properties</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/properties"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Properties
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {draftId ? "Edit Listing" : "Create Property Draft"}
            </h1>
            <StatusBadge status={draftStatus} size="sm" />
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Save a draft, upload media, review the checklist, and publish when the listing is ready.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          {saveState === "saving" && "Saving draft..."}
          {saveState === "saved" && "Saved as draft"}
          {saveState === "error" && "Draft save failed"}
          {saveState === "idle" && "Draft changes save as you work"}
        </div>
      </div>

      {(serverError || publishError) && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          {publishError || serverError}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {stepOrder.map((item, index) => {
          const isActive = item === step;
          const isComplete = index < currentStepIndex;

          return (
            <button
              key={item}
              type="button"
              onClick={() => handleStepClick(item)}
              className={`inline-flex min-w-max items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-[var(--color-deep-slate-blue)] bg-[var(--color-deep-slate-blue)] text-white"
                  : isComplete
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]"
              }`}
            >
              {isComplete ? <Check className="h-4 w-4" /> : <span>{index + 1}</span>}
              <span className="capitalize">{item}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {step === "basics" && (
            <Card className="border-0 shadow-sm ring-1 ring-black/5">
              <CardContent className="space-y-5 p-6 sm:p-8">
                <SectionIntro
                  title="Property Basics"
                  description="Start with the core details tenants and reviewers need to understand the home."
                />

                <Input
                  id="title"
                  label="Listing Title"
                  value={values.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  error={fieldErrors.title}
                  placeholder="Modern 3-bedroom apartment in Lekki Phase 1"
                />

                <div className="space-y-1.5">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-[var(--color-text-primary)]"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={7}
                    value={values.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    placeholder="Describe the apartment, nearby landmarks, parking, water supply, power, and finishes."
                    className="flex w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors focus:border-[var(--color-deep-slate-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/20"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">
                      Aim for 150 characters or more. Mention landmarks, finishing, parking, water, and power.
                    </span>
                    <span className="text-[var(--color-text-secondary)]">{values.description.trim().length}/150</span>
                  </div>
                  {fieldErrors.description && (
                    <p className="text-sm text-[var(--color-rejected)]">{fieldErrors.description}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    id="listing_purpose"
                    label="Listing Purpose"
                    options={listingPurposeOptions}
                    value={values.listing_purpose}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        listing_purpose: event.target.value as PropertyListingPurpose,
                        application_mode:
                          event.target.value === "sale"
                            ? "message_agent"
                            : current.application_mode,
                        asking_price:
                          event.target.value === "sale"
                            ? current.asking_price
                            : null,
                        rent_amount:
                          event.target.value === "rent"
                            ? current.rent_amount
                            : null,
                        fees: event.target.value === "sale" ? [] : current.fees,
                      }))
                    }
                  />
                  <Select
                    id="property_type"
                    label="Property Type"
                    options={propertyTypeOptions}
                    value={values.property_type}
                    onChange={(event) => updateField("property_type", event.target.value as PropertyType)}
                  />
                  <Select
                    id="area"
                    label="Area"
                    placeholder="Select area"
                    options={areaOptions}
                    value={values.area}
                    onChange={(event) => updateField("area", event.target.value)}
                    error={fieldErrors.area}
                  />
                </div>

                {values.listing_purpose === "rent" ? (
                  <Select
                    id="application_mode"
                    label="Application Flow"
                    options={applicationModeOptions}
                    value={values.application_mode}
                    onChange={(event) => updateField("application_mode", event.target.value as ComposerValues["application_mode"])}
                  />
                ) : (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                    Sale listings use Message Agent only. Buyers submit contact intent instead of applications.
                  </div>
                )}

                <Input
                  id="address_line"
                  label="Street Address"
                  value={values.address_line}
                  onChange={(event) => updateField("address_line", event.target.value)}
                  error={fieldErrors.address_line}
                  placeholder="14 Admiralty Way, Lekki Phase 1"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <NumericInput
                    id="bedrooms"
                    label="Bedrooms"
                    value={values.bedrooms}
                    onValueChange={(value) => updateField("bedrooms", value)}
                  />
                  <NumericInput
                    id="bathrooms"
                    label="Bathrooms"
                    value={values.bathrooms}
                    onValueChange={(value) => updateField("bathrooms", value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {step === "pricing" && (
            <Card className="border-0 shadow-sm ring-1 ring-black/5">
              <CardContent className="space-y-5 p-6 sm:p-8">
                <SectionIntro
                  title="Pricing Breakdown"
                  description={
                    values.listing_purpose === "sale"
                      ? "Set the asking price in naira. Buyer contact starts from the property page."
                      : "Use annual rent in naira, then add structured fee lines so tenants see the full move-in cost upfront."
                  }
                />

                {values.listing_purpose === "sale" ? (
                  <NumericInput
                    id="asking_price"
                    label="Asking Price (NGN)"
                    value={values.asking_price}
                    onValueChange={(value) => updateField("asking_price", value)}
                    format="currency"
                    error={fieldErrors.asking_price}
                  />
                ) : (
                  <>
                    <NumericInput
                      id="rent_amount"
                      label="Annual Rent (NGN)"
                      value={values.rent_amount}
                      onValueChange={(value) => updateField("rent_amount", value)}
                      format="currency"
                      error={fieldErrors.rent_amount}
                    />

                    <div className="space-y-3">
                  {values.fees.map((fee, index) => {
                    const feeType = feeTypesQuery.data?.data?.find(
                      (item) => item.id === fee.fee_type_id,
                    );
                    const valueModeOptions = [
                      feeType?.supports_fixed
                        ? { value: "fixed", label: "Fixed amount" }
                        : null,
                      feeType?.supports_percentage
                        ? { value: "percentage", label: "Percentage of rent" }
                        : null,
                    ].filter(Boolean) as { value: string; label: string }[];

                    return (
                      <div key={`${fee.fee_type_id}-${index}`} className="rounded-2xl border border-[var(--color-border)] p-4">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_180px_minmax(0,1fr)_auto]">
                          <Select
                            id={`fee_type_${index}`}
                            label="Fee Type"
                            options={feeTypeOptions}
                            value={fee.fee_type_id}
                            onChange={(event) => {
                              const selected = feeTypesQuery.data?.data?.find(
                                (item) => item.id === event.target.value,
                              );
                              updateFee(index, {
                                fee_type_id: event.target.value,
                                label: selected?.name,
                                value_type: selected?.supports_fixed ? "fixed" : "percentage",
                                amount: selected?.supports_fixed ? fee.amount ?? null : null,
                                percentage: selected?.supports_fixed ? null : fee.percentage ?? null,
                              });
                            }}
                          />
                          <Select
                            id={`fee_value_type_${index}`}
                            label="Value Mode"
                            options={valueModeOptions}
                            value={fee.value_type}
                            onChange={(event) =>
                              updateFee(index, {
                                value_type: event.target.value as PropertyFeeInput["value_type"],
                              })
                            }
                          />
                          {fee.value_type === "fixed" ? (
                            <NumericInput
                              id={`fee_amount_${index}`}
                              label="Amount"
                              value={fee.amount ?? null}
                              onValueChange={(value) => updateFee(index, { amount: value })}
                              format="currency"
                              error={fieldErrors[`fee-${index}`]}
                            />
                          ) : (
                            <NumericInput
                              id={`fee_percentage_${index}`}
                              label="Percentage"
                              value={fee.percentage ?? null}
                              onValueChange={(value) => updateFee(index, { percentage: value })}
                              format="decimal"
                              error={fieldErrors[`fee-${index}`]}
                            />
                          )}
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => removeFee(index)}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                          This fee adds {formatCurrency(buildDraftPricingSummary(values.rent_amount ?? 0, values.asking_price ?? 0, [fee]).fees_total)} to the move-in total.
                        </p>
                      </div>
                    );
                  })}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="button" variant="secondary" onClick={addFee} disabled={!feeTypesQuery.data?.data?.length}>
                        <Plus className="h-4 w-4" />
                        Add Fee
                      </Button>
                      <button
                        type="button"
                        onClick={() => setShowFeeTypeCreator((current) => !current)}
                        className="text-sm font-medium text-[var(--color-deep-slate-blue)]"
                      >
                        Can&apos;t find the right fee type? Add one
                      </button>
                    </div>

                    {showFeeTypeCreator && (
                      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background)] p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Input
                            id="new_fee_type_name"
                            label="New Fee Type Name"
                            value={newFeeTypeName}
                            onChange={(event) => setNewFeeTypeName(event.target.value)}
                          />
                          <Input
                            id="new_fee_type_description"
                            label="Short Description"
                            value={newFeeTypeDescription}
                            onChange={(event) => setNewFeeTypeDescription(event.target.value)}
                          />
                        </div>
                        <div className="mt-4 flex gap-3">
                          <Button type="button" onClick={handleCreateFeeType} isLoading={createFeeType.isPending}>
                            Save Fee Type
                          </Button>
                          <Button type="button" variant="secondary" onClick={() => setShowFeeTypeCreator(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {step === "media" && (
            <Card className="border-0 shadow-sm ring-1 ring-black/5">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <SectionIntro
                  title="Media"
                  description="Upload at least 5 clear photos. Add a walkthrough video if you have one."
                />

                {!draftId ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Save your draft after pricing before uploading media.
                  </div>
                ) : (
                  <>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => imageInputRef.current?.click()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          imageInputRef.current?.click();
                        }
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsImageDropActive(true);
                      }}
                      onDragLeave={(event) => {
                        event.preventDefault();
                        if (event.currentTarget === event.target) {
                          setIsImageDropActive(false);
                        }
                      }}
                      onDrop={handleImageDrop}
                      aria-label="Upload property photos"
                      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed px-6 py-10 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/20 ${
                        isImageDropActive
                          ? "border-[var(--color-deep-slate-blue)] bg-blue-50/60"
                          : "border-[var(--color-border)] bg-[var(--color-background)]"
                      }`}
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[var(--color-deep-slate-blue)] shadow-sm">
                        {uploadingImages ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">Add at least 5 clear photos</p>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                          Include living area, bedrooms, bathrooms, kitchen, and exterior where possible.
                        </p>
                        <p className="mt-2 text-sm font-medium text-[var(--color-deep-slate-blue)]">
                          Drag and drop photos here or click to browse.
                        </p>
                      </div>
                      <input
                        ref={imageInputRef}
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {imageItems.map((image, index) => (
                        <div
                          key={image.id}
                          draggable
                          onDragStart={() => {
                            setDraggedImageId(image.id);
                            setDropTargetImageId(image.id);
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            if (draggedImageId && draggedImageId !== image.id) {
                              setDropTargetImageId(image.id);
                            }
                          }}
                          onDragEnd={() => {
                            setDraggedImageId(null);
                            setDropTargetImageId(null);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (draggedImageId) {
                              void reorderImagesByDrag(draggedImageId, image.id);
                            }
                          }}
                          className={`overflow-hidden rounded-3xl border bg-white transition-shadow ${
                            dropTargetImageId === image.id && draggedImageId !== image.id
                              ? "border-[var(--color-deep-slate-blue)] shadow-md"
                              : "border-[var(--color-border)]"
                          }`}
                        >
                          <div className="aspect-[4/3] bg-gray-100">
                            <img src={image.image_url} alt={`Property image ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                          <div className="space-y-3 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-[var(--color-text-primary)]">Photo {index + 1}</span>
                              {index === 0 ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                  Cover
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                              Drag to reorder. The first photo becomes the cover automatically.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <Button type="button" variant="secondary" size="sm" onClick={() => moveImage(image.id, "up")} disabled={index === 0 || reorderingImages}>
                                <ChevronUp className="h-4 w-4" />
                                Up
                              </Button>
                              <Button type="button" variant="secondary" size="sm" onClick={() => moveImage(image.id, "down")} disabled={index === imageItems.length - 1 || reorderingImages}>
                                <ChevronDown className="h-4 w-4" />
                                Down
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="col-span-2"
                                onClick={() => void handleRemoveImage(image.id)}
                                disabled={removingImageIds.includes(image.id)}
                                isLoading={removingImageIds.includes(image.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsVideoDropActive(true);
                      }}
                      onDragLeave={(event) => {
                        event.preventDefault();
                        if (event.currentTarget === event.target) {
                          setIsVideoDropActive(false);
                        }
                      }}
                      onDrop={handleVideoDrop}
                      className={`rounded-3xl border bg-white p-5 transition-colors ${
                        isVideoDropActive
                          ? "border-[var(--color-deep-slate-blue)] bg-blue-50/40"
                          : "border-[var(--color-border)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">Add a walkthrough video</p>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            Optional, but useful for trust and engagement.
                          </p>
                          <p className="mt-2 text-sm font-medium text-[var(--color-deep-slate-blue)]">
                            Drag and drop a walkthrough video anywhere in this card or click Upload Video.
                          </p>
                        </div>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => videoInputRef.current?.click()}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              videoInputRef.current?.click();
                            }
                          }}
                          aria-label="Upload property video"
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                            isVideoDropActive
                              ? "border-[var(--color-deep-slate-blue)] bg-blue-50/60 text-[var(--color-deep-slate-blue)]"
                              : "border-[var(--color-border)] text-[var(--color-text-primary)]"
                          }`}
                        >
                          <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            className="hidden"
                            onChange={handleVideoUpload}
                          />
                          {uploadingVideo ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          Upload Video
                        </div>
                      </div>

                      {videoItems[0] && (
                        <div className="mt-4 space-y-3 rounded-2xl border border-[var(--color-border)] p-4">
                          <video controls preload="metadata" className="w-full rounded-2xl bg-black">
                            <source src={videoItems[0].video_url} type={videoItems[0].mime_type ?? "video/mp4"} />
                          </video>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            Drop a new video here to replace the current walkthrough.
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleRemoveVideo(videoItems[0].id)}
                            disabled={removingVideoId === videoItems[0].id}
                            isLoading={removingVideoId === videoItems[0].id}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove Video
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {step === "review" && (
            <Card className="border-0 shadow-sm ring-1 ring-black/5">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <SectionIntro
                  title="Review And Publish"
                  description="Check the listing summary, confirm the fee breakdown, and publish when every blocker is cleared."
                />

                <div className="grid gap-4 lg:grid-cols-2">
                  <SummaryCard title="Listing Summary">
                    <SummaryRow label="Title" value={values.title || "—"} />
                    <SummaryRow label="Purpose" value={formatListingPurpose(values.listing_purpose)} />
                    <SummaryRow label="Area" value={values.area || "—"} />
                    <SummaryRow label="Address" value={values.address_line || "—"} />
                      <SummaryRow label="Property Type" value={formatPropertyType(values.property_type)} />
                    <SummaryRow label="Beds / Baths" value={`${values.bedrooms ?? "-"} / ${values.bathrooms ?? "-"}`} />
                  </SummaryCard>

                  <SummaryCard title="Media & Trust">
                    <SummaryRow label="Photos" value={`${imageItems.length} uploaded`} />
                    <SummaryRow label="Video" value={videoItems[0] ? "Added" : "Optional"} />
                    <SummaryRow label="Verification" value="Published listings can go live before property verification." />
                  </SummaryCard>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-sm leading-6 text-[var(--color-text-secondary)]">
                  Your listing can go live before property verification. Verified listings earn stronger trust signals in search.
                </div>

                {!checklist.ready_to_publish && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {checklist.blockers.join(". ")}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card className="border-0 bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fb_100%)] shadow-sm ring-1 ring-black/5">
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="font-semibold text-[var(--color-text-primary)]">Publish readiness</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {checklist.completed_count} of {checklist.total_count} checks complete
                </p>
              </div>

              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-[var(--color-deep-slate-blue)]"
                  style={{ width: `${checklist.progress_percentage}%` }}
                />
              </div>

              <div className="space-y-2">
                {checklist.checklist.map((item) => (
                  <div key={item.key} className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-3">
                    <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${item.completed ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {item.completed ? <Check className="h-3.5 w-3.5" /> : ""}
                    </span>
                    <span className="text-sm text-[var(--color-text-secondary)]">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-black/5">
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="font-semibold text-[var(--color-text-primary)]">Pricing summary</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {values.listing_purpose === "sale"
                    ? "Buyer-facing asking price for agent contact intent"
                    : "Transparent move-in cost shown to tenants"}
                </p>
              </div>

              {values.listing_purpose === "sale" ? (
                <SummaryRow
                  label="Asking price"
                  value={
                    formatPropertyPriceLabel({
                      listingPurpose: values.listing_purpose,
                      rentAmount: values.rent_amount,
                      askingPrice: values.asking_price,
                    }).amount
                  }
                  strong
                />
              ) : (
                <>
                  <SummaryRow label="Annual rent" value={formatCurrency(pricingSummary.annual_rent)} />
                  <SummaryRow label="Monthly equivalent" value={formatCurrency(pricingSummary.monthly_equivalent)} />
                  <SummaryRow label="Fees total" value={formatCurrency(pricingSummary.fees_total)} />

                  <div className="border-t border-[var(--color-border)] pt-4">
                    <SummaryRow label="Total move-in cost" value={formatCurrency(pricingSummary.total_move_in_cost)} strong />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-border)] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[var(--color-text-secondary)]">
            {step === "review"
              ? checklist.ready_to_publish
                ? "All publish blockers are cleared."
                : `${checklist.blockers.length} publish blocker${checklist.blockers.length === 1 ? "" : "s"} remaining.`
              : "Save your draft at any time and continue later."}
          </div>

          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" onClick={handleSaveDraft}>
              <Save className="h-4 w-4" />
              Save Draft
            </Button>

            {step !== "basics" && (
              <Button
                type="button"
                variant="ghost"
                className="flex-1 sm:flex-none"
                onClick={() => updateStep(stepOrder[currentStepIndex - 1])}
              >
                Back
              </Button>
            )}

            {step !== "review" ? (
              <Button
                type="button"
                className="flex-1 sm:flex-none"
                onClick={handleContinue}
                isLoading={continuingToMedia}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1 sm:flex-none"
                onClick={handlePublish}
                disabled={!checklist.ready_to_publish || publishingListing || publishProperty.isPending}
                isLoading={publishingListing || publishProperty.isPending}
              >
                Publish Listing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildPayload(values: ComposerValues): CreatePropertyInput {
  return {
    title: values.title,
    description: values.description,
    area: values.area,
    address_line: values.address_line,
    property_type: values.property_type,
    listing_purpose: values.listing_purpose,
    bedrooms: values.bedrooms ?? 0,
    bathrooms: values.bathrooms ?? 0,
    rent_amount: values.listing_purpose === "rent" ? values.rent_amount ?? 0 : null,
    asking_price: values.listing_purpose === "sale" ? values.asking_price ?? 0 : null,
    service_charge: null,
    caution_deposit: null,
    agency_fee: null,
    application_mode:
      values.listing_purpose === "sale" ? "message_agent" : values.application_mode,
    fees: values.fees.map((fee, index) => ({
      ...fee,
      display_order: index,
    })),
  };
}

function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <h3 className="mb-3 font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className={strong ? "text-sm font-semibold text-[var(--color-text-primary)]" : "text-sm text-[var(--color-text-primary)]"}>
        {value}
      </span>
    </div>
  );
}

function AccessCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="space-y-5 p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-[var(--color-pending)]">
          <CircleAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
        </div>
        <Link href="/dashboard/properties">
          <Button variant="secondary">Back to My Properties</Button>
        </Link>
      </CardContent>
    </Card>
  );
}