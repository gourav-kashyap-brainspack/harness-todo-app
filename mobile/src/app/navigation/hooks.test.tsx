import React from 'react';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {act, create as createRenderer} from 'react-test-renderer';
import {describe, expect, it} from '@jest/globals';

import {useAppNavigation, useAppRoute} from './hooks';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function NavigationProbeScreen(): React.JSX.Element {
  const navigation = useAppNavigation<'TaskDetail'>();
  return <Text accessibilityLabel="nav-probe">{typeof navigation.navigate}</Text>;
}

function RouteProbeScreen(): React.JSX.Element {
  const route = useAppRoute<'TaskDetail'>();
  return <Text accessibilityLabel="route-probe">{route.params.taskId}</Text>;
}

/**
 * Direct coverage for the typed helpers (FND-003, FR3) — each rendered as
 * the stack's only/initial screen so no push-transition animation runs
 * (see navigation.test.tsx's comment on the Easing/fake-timers dance that
 * pushed screens require; an initial screen needs none of that).
 */
describe('typed navigation/route helpers (FND-003, FR3)', () => {
  it('useAppNavigation() returns a navigation object with a callable .navigate', () => {
    let tree!: ReturnType<typeof createRenderer>;

    act(() => {
      tree = createRenderer(
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="TaskDetail"
              component={NavigationProbeScreen}
              initialParams={{taskId: 't-1'}}
            />
          </Stack.Navigator>
        </NavigationContainer>,
      );
    });

    expect(tree.root.findByProps({accessibilityLabel: 'nav-probe'}).props.children).toBe(
      'function',
    );
  });

  it('useAppRoute() reads the typed route params', () => {
    let tree!: ReturnType<typeof createRenderer>;

    act(() => {
      tree = createRenderer(
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="TaskDetail"
              component={RouteProbeScreen}
              initialParams={{taskId: 'route-hook-42'}}
            />
          </Stack.Navigator>
        </NavigationContainer>,
      );
    });

    expect(tree.root.findByProps({accessibilityLabel: 'route-probe'}).props.children).toBe(
      'route-hook-42',
    );
  });
});
