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
