/**
 * Todo App
 * @format
 */

import './global.css';

import React from 'react';
import {Text, View} from 'react-native';
import {AppProviders} from '@/app/AppProviders';

function App(): React.JSX.Element {
  return (
    <AppProviders>
      <View className="flex-1 items-center justify-center bg-bg">
        <Text
          className="text-xl text-primary"
          accessibilityRole="header"
          accessibilityLabel="Todo App">
          Todo App
        </Text>
      </View>
    </AppProviders>
  );
}

export default App;
