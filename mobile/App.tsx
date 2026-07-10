/**
 * Todo App
 * @format
 */

import './global.css';

import React from 'react';
import {AppProviders} from '@/app/AppProviders';
import {NavigationRoot} from '@/app/navigation';

function App(): React.JSX.Element {
  return (
    <AppProviders>
      <NavigationRoot />
    </AppProviders>
  );
}

export default App;
