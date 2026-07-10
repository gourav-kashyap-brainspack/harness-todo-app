import React from 'react';
import {Pressable} from 'react-native';
import {createBottomTabNavigator, type BottomTabBarButtonProps} from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';

import {NATIVE_CHROME_RGB, rgbFromTriplet, useTheme} from '@/theme';

import {HomeScreen, ProfileScreen} from './screens';
import type {TabParamList} from './types';

const Tab = createBottomTabNavigator<TabParamList>();

// Minimum a11y touch target (conventions.md RN checklist: >=44pt/48dp).
const TAB_HIT_SLOP = {top: 8, bottom: 8, left: 8, right: 8};

/**
 * Forces a stable, cross-platform `accessibilityRole="button"` on every tab
 * button (FR7) — the library's own default
 * (`node_modules/@react-navigation/bottom-tabs/lib/module/views/
 * BottomTabItem.js`) is `Platform.select({ios: 'button', default: 'tab'})`,
 * which would make the role diverge between iOS and Android. `hitSlop`
 * pads below-target touch areas up to the checklist's floor without
 * changing the visible tab bar layout.
 */
function AccessibleTabBarButton({to: _to, ...rest}: BottomTabBarButtonProps): React.JSX.Element {
  return <Pressable {...rest} accessibilityRole="button" hitSlop={TAB_HIT_SLOP} />;
}

// Icon renderers defined at module scope (not inline in `screenOptions`) so
// they're a stable component reference across renders — an inline arrow
// function here would be a fresh component type every render
// (`react/no-unstable-nested-components`), forcing React to re-mount the
// icon's subtree.
function HomeTabIcon({color, size}: {color: string; size: number}): React.JSX.Element {
  return <Feather name="home" color={color} size={size} />;
}

function ProfileTabIcon({color, size}: {color: string; size: number}): React.JSX.Element {
  return <Feather name="user" color={color} size={size} />;
}

/**
 * Bottom-tab navigator (FND-003, FR2) — exactly two tabs, Home and Profile.
 * Stable, visible tab text ("Home"/"Profile") is the Maestro/E2E anchor
 * (conventions.md §E2E selectors — text/accessibilityLabel, never testID);
 * `tabBarAccessibilityLabel` is set explicitly so Android also gets a real
 * accessibilityLabel (the library only auto-derives one on iOS).
 */
export function TabNavigator(): React.JSX.Element {
  const {resolvedScheme} = useTheme();
  const tint = NATIVE_CHROME_RGB[resolvedScheme];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarButton: AccessibleTabBarButton,
        tabBarActiveTintColor: rgbFromTriplet(tint.primary),
        tabBarInactiveTintColor: rgbFromTriplet(tint.textMuted),
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home',
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarAccessibilityLabel: 'Profile',
          tabBarIcon: ProfileTabIcon,
        }}
      />
    </Tab.Navigator>
  );
}
