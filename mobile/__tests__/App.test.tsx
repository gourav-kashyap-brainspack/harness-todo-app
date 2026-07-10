/**
 * @format
 */

import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {it, expect} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

// FND-003: App now mounts a real NavigationContainer, which schedules
// passive effects on mount (e.g. React Navigation's hardware-back-button
// listener). `act()` is required so those effects flush synchronously
// before the test asserts/finishes — without it they can fire after Jest
// has already torn the test's module environment down.
it('renders correctly without throwing', () => {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<App />);
  });
  expect(tree!.toJSON()).toBeTruthy();
});
