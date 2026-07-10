import React, {type PropsWithChildren} from 'react';
import {ScrollView, View} from 'react-native';
import {SafeAreaView, type Edge} from 'react-native-safe-area-context';

export interface ScreenProps extends PropsWithChildren {
  edges?: Edge[];
  scroll?: boolean;
  className?: string;
}

const DEFAULT_EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];

// The gutter + width-cap every screen mounts once (F-046): `px-4` (16dp, the
// documented "screen horizontal margin" step) is the gutter on any phone
// width; at Tailwind's own `sm:` breakpoint (640dp — wider than any phone
// portrait width) content caps at `max-w-2xl` and centers, so a
// large-screen/landscape/tablet viewport never stretches text edge-to-edge.
// Both values are Tailwind's default scale, not invented — see
// docs/context/design-system.md → Component inventory → `Screen`/`Container`.
const CONTENT_CLASS_NAME = 'flex-1 w-full px-4 sm:max-w-2xl sm:self-center';

/**
 * Screen / Container (FND-005, F-046) — the responsive layout root every
 * screen mounts once: SafeArea insets + gutter + width capping. Features
 * consume this rather than re-deriving insets/gutters per screen.
 *
 * No fixed pixel dimensions anywhere here — flex + relative widths handle
 * rotation automatically, and the `sm:` breakpoint above is NativeWind's own
 * responsive resolution, not something this component computes. A feature
 * screen that needs a layout decision beyond that breakpoint (e.g. a
 * landscape two-pane split) reaches for RN's own `useWindowDimensions()`
 * directly — this primitive doesn't need it for the base case.
 */
export function Screen({
  children,
  edges = DEFAULT_EDGES,
  scroll = false,
  className,
}: ScreenProps): React.JSX.Element {
  const safeAreaClassName = `flex-1 bg-bg ${className ?? ''}`.trim();

  return (
    <SafeAreaView edges={edges} className={safeAreaClassName}>
      {scroll ? (
        <ScrollView className={CONTENT_CLASS_NAME} contentContainerClassName="flex-grow">
          {children}
        </ScrollView>
      ) : (
        <View className={CONTENT_CLASS_NAME}>{children}</View>
      )}
    </SafeAreaView>
  );
}
