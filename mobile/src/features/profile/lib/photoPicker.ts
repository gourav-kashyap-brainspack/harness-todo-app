import {launchCamera, launchImageLibrary, type ImagePickerResponse} from 'react-native-image-picker';

/**
 * PRO-003 (FR1-FR4) — the ONE place `react-native-image-picker` is called
 * from. PRO owns the capture + permission flow (STG coherence gap (f)
 * sibling rule: "STG persists only the uri string"); this module's job ends
 * at handing back a plain uri string (or a typed non-throwing outcome) —
 * callers (`AvatarPhotoField`) never touch the library directly, and never
 * see bytes/base64, only `PhotoPickResult`.
 *
 * Grounded against the installed `react-native-image-picker@8.2.1` API via
 * Context7 (ADR-0035) — `launchCamera`/`launchImageLibrary` never throw for
 * the ordinary "no photo" outcomes (user cancel, OS permission denial,
 * camera unavailable): they resolve with `didCancel`/`errorCode` on the
 * response instead, which is what `toPickResult` below normalizes. A denied
 * permission is therefore data, not an exception — FR4's "never crash or
 * hang" falls out of just handling that response shape, no separate
 * try/catch needed.
 */

export type PhotoPickErrorReason = 'permission' | 'camera_unavailable' | 'other';

export type PhotoPickResult =
  | {status: 'success'; uri: string}
  | {status: 'cancelled'}
  | {status: 'error'; reason: PhotoPickErrorReason};

// Resize/compress at the source (NFR "Performance / privacy") rather than
// persisting whatever the OS hands back — 1024dp is comfortably larger than
// any on-screen avatar size (`Avatar`'s largest preset is 80dp) while still
// capping a modern phone camera's multi-thousand-pixel capture down to a
// sane file. `includeBase64: false` — this app never wants the image as an
// in-memory string, only ever the file uri (FR5).
const COMMON_OPTIONS = {
  mediaType: 'photo' as const,
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.7 as const,
  includeBase64: false,
};

/**
 * Maps the library's `ImagePickerResponse` (which is ALWAYS the resolved
 * value — cancel/permission/unavailable are outcomes on it, not rejections)
 * to this module's small closed result type, so every caller handles
 * exactly three cases instead of re-deriving `didCancel`/`errorCode`
 * checks per call site.
 */
function toPickResult(response: ImagePickerResponse): PhotoPickResult {
  if (response.didCancel) {
    return {status: 'cancelled'};
  }
  if (response.errorCode) {
    // The library's `ErrorCode` union spells the generic case `'others'`
    // (plural) — normalized to this module's `'other'` so callers match on
    // one consistent spelling.
    const reason: PhotoPickErrorReason =
      response.errorCode === 'others' ? 'other' : response.errorCode;
    return {status: 'error', reason};
  }
  const uri = response.assets?.[0]?.uri;
  return uri ? {status: 'success', uri} : {status: 'error', reason: 'other'};
}

/** Launches the device camera. See module doc for the response contract. */
export async function pickPhotoFromCamera(): Promise<PhotoPickResult> {
  const response = await launchCamera({...COMMON_OPTIONS, saveToPhotos: false});
  return toPickResult(response);
}

/** Launches the device photo library, single-selection only. */
export async function pickPhotoFromLibrary(): Promise<PhotoPickResult> {
  const response = await launchImageLibrary({...COMMON_OPTIONS, selectionLimit: 1});
  return toPickResult(response);
}
