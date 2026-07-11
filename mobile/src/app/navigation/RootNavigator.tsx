import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {TabNavigator} from './TabNavigator';
import {
  AddTaskScreen,
  EditTaskScreen,
  ProfileSetupScreen,
  SplashScreen,
  TaskDetailScreen,
} from './screens';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root native-stack (FND-003, FR1) — hosts Splash (initial route),
 * ProfileSetup, the Tabs navigator, and the pushed task screens
 * (Add/Edit/TaskDetail — placeholders here, built out in TSK).
 *
 * No `linking` config is wired (spec: no deep links in MVP) — the shape
 * (a single root stack with named, typed routes) is compatible with adding
 * one later without restructuring.
 *
 * Headers default to hidden (Splash/ProfileSetup/Tabs manage their own
 * chrome — Tabs' inner screens show their own per-tab header); the pushed
 * task screens opt back in with a real title + native back button (FR5).
 */
export function RootNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{headerShown: false}}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      {/* headerShown:false inherited from screenOptions — ProfileSetup (the
          real PRO-001 screen since PRO-001) is a mandatory first-launch
          screen with no back target, so no header/title is rendered (a
          `title` here would be dead per code review). */}
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="AddTask"
        component={AddTaskScreen}
        options={{headerShown: true, title: 'Add Task'}}
      />
      <Stack.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={{headerShown: true, title: 'Edit Task'}}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{headerShown: true, title: 'Task Details'}}
      />
    </Stack.Navigator>
  );
}
