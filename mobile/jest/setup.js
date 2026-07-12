/* eslint-env jest */
// react-native-safe-area-context's real `SafeAreaProvider` withholds
// rendering its children until it receives an initial-insets event from the
// native side — which never fires under Jest (no real native bridge), so
// anything nested inside it (the whole app past AppProviders, post FND-003)
// silently renders as `children: null` forever. The package ships an
// official Jest mock (`react-native-safe-area-context/jest/mock`) whose
// `SafeAreaProvider` renders children immediately with fixed mock metrics —
// see the package's own README → "Test setup". Wired globally (not per test
// file) because every screen tree mounts through `AppProviders`' single
// `SafeAreaProvider`.
// The mock module's own source (`jest/mock.tsx`) only has a default export;
// unwrap `.default` here so named imports (`import {SafeAreaProvider} from
// 'react-native-safe-area-context'`, as used throughout the app) resolve
// correctly instead of getting `undefined`.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// react-native-bootsplash's JS wraps a TurboModule via
// `TurboModuleRegistry.getEnforcing("RNBootSplash")` (see node_modules/
// react-native-bootsplash/src/specs/NativeRNBootSplash.ts) — that throws
// under Jest (no native module registered, old-arch project). FND-004 wires
// a real `BootSplash.hide()` call into the RootStack's `Splash` route, so
// every test that mounts through `RootNavigator` (not just this task's own
// tests) now needs a working mock — wired globally for the same reason the
// safe-area-context mock above is: it must hold for any current or future
// test that mounts the app's real navigation tree, not just the file that
// happens to introduce the need.
jest.mock('react-native-bootsplash', () => ({
  __esModule: true,
  default: {
    hide: jest.fn(() => Promise.resolve()),
    isVisible: jest.fn(() => false),
    useHideAnimation: jest.fn(() => ({
      container: {style: {}, onLayout: jest.fn()},
      logo: {source: -1},
      brand: {source: -1},
    })),
  },
}));

// react-native-image-picker (PRO-003) calls through to
// `NativeModules.ImagePicker`, which is unregistered under Jest (no real
// native bridge) — an unmocked `launchCamera`/`launchImageLibrary` call
// throws `Cannot read properties of undefined`. Mocked globally for the
// same reason as the two mocks above: ANY test that mounts
// `AvatarPhotoField` (both Profile screens, post PRO-003) must be safe by
// default, not just the test file that happens to press "Take Photo".
// Defaults to `{didCancel: true}` (a safe no-op); individual tests override
// the resolved value per call via
// `jest.mocked(launchCamera).mockResolvedValueOnce(...)`.
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(() => Promise.resolve({didCancel: true})),
  launchImageLibrary: jest.fn(() => Promise.resolve({didCancel: true})),
}));

// @react-native-community/datetimepicker (TSK-005) ships a real native
// component (default export, the iOS/inline flow) plus an Android-only
// imperative API (`DateTimePickerAndroid.open`/`dismiss`, no native bridge
// under Jest — an unmocked call throws the same
// `TurboModuleRegistry`-style error the other native-module mocks above
// guard against). Mocked globally for the same reason: ANY test that mounts
// `DueDateField` (`TaskForm`, and therefore both `AddTaskScreen` and
// `EditTaskScreen`, post TSK-005) must be safe by default, not just
// `DueDateField.test.tsx`. The default-export component is a plain
// `jest.fn(() => null)` — `DueDateField.test.tsx` locates it via
// `tree.root.findByType(DateTimePicker)` (the same "still findable by
// reference even though it renders null" mechanism the app's other
// composite-component tests rely on, e.g. `TextInput` lookups) and fires
// `.props.onChange(event, date)` directly to simulate a pick. `open`
// defaults to a no-op (safe if a test never overrides it);
// individual tests override behaviour via
// `jest.mocked(DateTimePickerAndroid.open).mockImplementation(...)`.
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: jest.fn(() => null),
  DateTimePickerAndroid: {
    open: jest.fn(),
    dismiss: jest.fn(() => Promise.resolve(true)),
  },
}));
