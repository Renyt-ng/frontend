export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from "./useMediaQuery";

export { locationKeys, useLocations } from "./useLocations";

export {
  propertyKeys,
  useProperties,
  useProperty,
  useManageProperty,
  useMyProperties,
  useFeeTypes,
  usePropertyTypes,
  useCreateFeeType,
  useCreateProperty,
  useUpdateProperty,
  usePublishProperty,
  useUploadPropertyImage,
  useReorderPropertyImages,
  useSetPropertyCoverImage,
  useDeletePropertyImage,
  useUploadPropertyVideo,
  useDeletePropertyVideo,
} from "./useProperties";

export {
  applicationKeys,
  useMyApplications,
  usePropertyApplications,
  useSubmitApplication,
  useUpdateApplicationStatus,
} from "./useApplications";

export {
  leaseKeys,
  useMyLeases,
  useCreateLease,
  useSendLease,
  useSignLease,
} from "./useLeases";

export { agentKeys, useMyAgent, useAgent, useCreateAgent } from "./useAgents";

export { profileKeys, useProfile, useUpdateProfile, useUploadProfileAvatar } from "./useAuth";

export {
  adminKeys,
  useAdminOverview,
  useAdminAuditLogs,
  useAdminReferralEvents,
  useAdminReferralProgram,
  useAdminUsers,
  useAdminAgents,
  useAdminProperties,
  useAdminLocations,
  useAdminPropertyTypes,
  useCreateAdminLocation,
  useCreateAdminPropertyType,
  useUpdateAdminLocation,
  useUpdateAdminPropertyType,
  useAdminEmailProviders,
  useUpdateAdminEmailProvider,
  useAdminEmailNotifications,
  useUpdateAdminEmailNotification,
  useAdminEmailHealth,
  useAdminEmailEvents,
  useSendAdminTestEmail,
  useSuspendUser,
  useRestoreUser,
  useUpdateReferralProgramSettings,
  useCreateReferralCampaign,
  useUpdateReferralCampaign,
  useUpdateUserAvatarReview,
  useUpdateReferralEvent,
  useUpdateAgentStatus,
  useVerifyProperty,
} from "./useAdmin";

export {
  propertyInteractionKeys,
  usePropertyEngagementStatus,
  useTogglePropertyEngagement,
  useCreatePropertyInquiry,
  useTrackPropertyMessageIntent,
} from "./usePropertyInteractions";

export {
  referralKeys,
  useReferralDashboard,
  useReferralPropertyPreview,
  useEnrollReferralProgram,
  useCreateReferralShareLink,
} from "./useReferrals";
