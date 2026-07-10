import React from 'react';
import {Text, View} from 'react-native';

interface PlaceholderScreenProps {
  /** Real, human-facing screen name — also the a11y label/E2E anchor. */
  name: string;
  /** Optional secondary line (e.g. a route param echoed back for tests). */
  detail?: string;
}

/**
 * Themed centered placeholder (FND-003) — every stub screen in the
 * navigation shell renders one of these until its feature module (PRO/TSK)
 * fills it in. Semantic theme tokens only, per design-system.md.
 */
export function PlaceholderScreen({name, detail}: PlaceholderScreenProps): React.JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-bg px-6">
      <Text
        className="text-xl text-text"
        accessibilityRole="header"
        accessibilityLabel={name}>
        {name}
      </Text>
      {detail ? <Text className="mt-2 text-sm text-text-muted">{detail}</Text> : null}
    </View>
  );
}
