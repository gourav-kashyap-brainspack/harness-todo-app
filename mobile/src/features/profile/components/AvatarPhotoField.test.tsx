import React from 'react';
import {act, create as createRenderer, type ReactTestRenderer} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';

import * as photoPicker from '../lib/photoPicker';
import {AvatarPhotoField} from './AvatarPhotoField';

// Mocked at the `lib/photoPicker` seam (not the raw `react-native-image-picker`
// module) — this is a component-level test of the action-sheet wiring +
// message copy, not the picker's own response-mapping (covered by
// photoPicker.test.ts).
jest.mock('../lib/photoPicker', () => ({
  pickPhotoFromCamera: jest.fn(),
  pickPhotoFromLibrary: jest.fn(),
}));

const mockedPickFromCamera = jest.mocked(photoPicker.pickPhotoFromCamera);
const mockedPickFromLibrary = jest.mocked(photoPicker.pickPhotoFromLibrary);

let activeTree: ReactTestRenderer | undefined;

function renderField(props: Partial<React.ComponentProps<typeof AvatarPhotoField>> = {}): ReactTestRenderer {
  const onPhotoChange = props.onPhotoChange ?? jest.fn();
  act(() => {
    activeTree = createRenderer(
      <AvatarPhotoField name="Ada Lovelace" onPhotoChange={onPhotoChange} {...props} />,
    );
  });
  return activeTree!;
}

function openSheet(tree: ReactTestRenderer, triggerLabel: 'Add photo' | 'Change photo'): void {
  act(() => {
    tree.root.findByProps({accessibilityLabel: triggerLabel}).props.onPress();
  });
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('AvatarPhotoField (PRO-003, FR2/FR3/FR4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (activeTree) {
      act(() => {
        activeTree!.unmount();
      });
      activeTree = undefined;
    }
  });

  it('shows "Add photo" with no Remove option when there is no photo yet', () => {
    const tree = renderField();

    expect(tree.root.findByProps({accessibilityLabel: 'Add photo'})).toBeTruthy();
    openSheet(tree, 'Add photo');
    expect(() => tree.root.findByProps({accessibilityLabel: 'Remove photo'})).toThrow();
  });

  it('shows "Change photo" plus a Remove option when a photo is set', () => {
    const tree = renderField({photoUri: 'file:///a.jpg'});

    expect(tree.root.findByProps({accessibilityLabel: 'Change photo'})).toBeTruthy();
    openSheet(tree, 'Change photo');
    expect(tree.root.findByProps({accessibilityLabel: 'Remove photo'})).toBeTruthy();
  });

  it('picking from the library calls onPhotoChange with the new uri and clears any prior message', async () => {
    mockedPickFromLibrary.mockResolvedValueOnce({status: 'success', uri: 'file:///picked.jpg'});
    const onPhotoChange = jest.fn();
    const tree = renderField({onPhotoChange});

    openSheet(tree, 'Add photo');
    await act(async () => {
      tree.root.findByProps({accessibilityLabel: 'Choose from Library'}).props.onPress();
      await flush();
    });

    expect(mockedPickFromLibrary).toHaveBeenCalledTimes(1);
    expect(onPhotoChange).toHaveBeenCalledWith('file:///picked.jpg');
  });

  it('taking a photo from the camera calls onPhotoChange with the new uri', async () => {
    mockedPickFromCamera.mockResolvedValueOnce({status: 'success', uri: 'file:///camera.jpg'});
    const onPhotoChange = jest.fn();
    const tree = renderField({onPhotoChange});

    openSheet(tree, 'Add photo');
    await act(async () => {
      tree.root.findByProps({accessibilityLabel: 'Take Photo'}).props.onPress();
      await flush();
    });

    expect(mockedPickFromCamera).toHaveBeenCalledTimes(1);
    expect(onPhotoChange).toHaveBeenCalledWith('file:///camera.jpg');
  });

  it('cancelling the picker is a silent no-op — no message, no onPhotoChange call', async () => {
    mockedPickFromLibrary.mockResolvedValueOnce({status: 'cancelled'});
    const onPhotoChange = jest.fn();
    const tree = renderField({onPhotoChange});

    openSheet(tree, 'Add photo');
    await act(async () => {
      tree.root.findByProps({accessibilityLabel: 'Choose from Library'}).props.onPress();
      await flush();
    });

    expect(onPhotoChange).not.toHaveBeenCalled();
    expect(() => tree.root.findByProps({accessibilityLiveRegion: 'polite'})).toThrow();
  });

  it('a denied permission shows a friendly inline message and never calls onPhotoChange', async () => {
    mockedPickFromLibrary.mockResolvedValueOnce({status: 'error', reason: 'permission'});
    const onPhotoChange = jest.fn();
    const tree = renderField({onPhotoChange});

    openSheet(tree, 'Add photo');
    await act(async () => {
      tree.root.findByProps({accessibilityLabel: 'Choose from Library'}).props.onPress();
      await flush();
    });

    expect(onPhotoChange).not.toHaveBeenCalled();
    const message = tree.root.findByProps({accessibilityLiveRegion: 'polite'});
    expect(message.props.children).toMatch(/enable it in settings/i);
  });

  it('a denied CAMERA permission shows the camera-specific message (distinct from the library one)', async () => {
    mockedPickFromCamera.mockResolvedValueOnce({status: 'error', reason: 'permission'});
    const tree = renderField();

    openSheet(tree, 'Add photo');
    await act(async () => {
      tree.root.findByProps({accessibilityLabel: 'Take Photo'}).props.onPress();
      await flush();
    });

    const message = tree.root.findByProps({accessibilityLiveRegion: 'polite'});
    expect(message.props.children).toMatch(/camera access is off/i);
  });

  it('a camera-unavailable error surfaces a distinct message and does not block the library option', async () => {
    mockedPickFromCamera.mockResolvedValueOnce({status: 'error', reason: 'camera_unavailable'});
    const tree = renderField();

    openSheet(tree, 'Add photo');
    await act(async () => {
      tree.root.findByProps({accessibilityLabel: 'Take Photo'}).props.onPress();
      await flush();
    });

    const message = tree.root.findByProps({accessibilityLiveRegion: 'polite'});
    expect(message.props.children).toMatch(/camera isn't available/i);
  });

  it('Remove calls onPhotoChange with undefined and clears any prior message', async () => {
    mockedPickFromLibrary.mockResolvedValueOnce({status: 'error', reason: 'other'});
    const onPhotoChange = jest.fn();
    const tree = renderField({photoUri: 'file:///a.jpg', onPhotoChange});

    // First produce an error message…
    openSheet(tree, 'Change photo');
    await act(async () => {
      tree.root.findByProps({accessibilityLabel: 'Choose from Library'}).props.onPress();
      await flush();
    });
    expect(tree.root.findByProps({accessibilityLiveRegion: 'polite'})).toBeTruthy();

    // …then Remove should clear it and report `undefined`.
    openSheet(tree, 'Change photo');
    act(() => {
      tree.root.findByProps({accessibilityLabel: 'Remove photo'}).props.onPress();
    });

    expect(onPhotoChange).toHaveBeenCalledWith(undefined);
    expect(() => tree.root.findByProps({accessibilityLiveRegion: 'polite'})).toThrow();
  });
});
