import type { Context } from "../../types/context.js";
import type { GetStoreProfileInput, GetStoreProfileOutput } from "../store.js";

export type {
  GetStoreProfileInput,
  GetStoreProfileOutput,
  StoreProfile,
  StoreProfileImage,
  StoreProfileIntro,
  StoreProfileLocalizedContent,
  StoreProfileMetadata,
} from "../store.js";

/**
 * Store Extension Interface
 *
 * Implement this interface when your app wants AppStore to persist localized
 * introduction, FAQ, media-key, and related-app metadata during registration.
 */
export interface StoreExtensionInterface {
  /**
   * Return persisted App Store presentation metadata for this app.
   *
   * Function name: "metadata.getStoreProfile"
   */
  getStoreProfile(ctx: Context, params: GetStoreProfileInput): Promise<GetStoreProfileOutput>;
}

export const StoreFunctionNames = {
  getStoreProfile: "metadata.getStoreProfile",
} as const;
