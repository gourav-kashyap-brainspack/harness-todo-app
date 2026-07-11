import {describe, expect, it, jest} from '@jest/globals';

import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

import {pickPhotoFromCamera, pickPhotoFromLibrary} from './photoPicker';

// `react-native-image-picker` is mocked globally in jest/setup.js (PRO-003)
// with a `{didCancel: true}` default; each test below overrides the exact
// resolved value it needs.
const mockedLaunchCamera = jest.mocked(launchCamera);
const mockedLaunchImageLibrary = jest.mocked(launchImageLibrary);

describe('photoPicker (PRO-003, FR2/FR3/FR4)', () => {
  describe('pickPhotoFromCamera', () => {
    it('returns the picked uri on success', async () => {
      mockedLaunchCamera.mockResolvedValueOnce({
        assets: [{uri: 'file:///camera-photo.jpg'}],
      });

      const result = await pickPhotoFromCamera();

      expect(result).toEqual({status: 'success', uri: 'file:///camera-photo.jpg'});
      // Resize/compress options were actually passed through (NFR).
      expect(mockedLaunchCamera).toHaveBeenCalledWith(
        expect.objectContaining({maxWidth: 1024, maxHeight: 1024, includeBase64: false}),
      );
    });

    it('reports cancellation as a distinct, silent outcome', async () => {
      mockedLaunchCamera.mockResolvedValueOnce({didCancel: true});

      const result = await pickPhotoFromCamera();

      expect(result).toEqual({status: 'cancelled'});
    });

    it('maps a denied-permission response to a "permission" error', async () => {
      mockedLaunchCamera.mockResolvedValueOnce({errorCode: 'permission', errorMessage: 'denied'});

      const result = await pickPhotoFromCamera();

      expect(result).toEqual({status: 'error', reason: 'permission'});
    });

    it('maps camera_unavailable through unchanged', async () => {
      mockedLaunchCamera.mockResolvedValueOnce({errorCode: 'camera_unavailable'});

      const result = await pickPhotoFromCamera();

      expect(result).toEqual({status: 'error', reason: 'camera_unavailable'});
    });

    it('normalizes the library\'s "others" error code to "other"', async () => {
      mockedLaunchCamera.mockResolvedValueOnce({errorCode: 'others'});

      const result = await pickPhotoFromCamera();

      expect(result).toEqual({status: 'error', reason: 'other'});
    });

    it('treats a success response with no usable asset uri as an error, never a crash', async () => {
      mockedLaunchCamera.mockResolvedValueOnce({assets: []});

      const result = await pickPhotoFromCamera();

      expect(result).toEqual({status: 'error', reason: 'other'});
    });
  });

  describe('pickPhotoFromLibrary', () => {
    it('returns the picked uri on success and restricts to a single selection', async () => {
      mockedLaunchImageLibrary.mockResolvedValueOnce({
        assets: [{uri: 'file:///library-photo.jpg'}],
      });

      const result = await pickPhotoFromLibrary();

      expect(result).toEqual({status: 'success', uri: 'file:///library-photo.jpg'});
      expect(mockedLaunchImageLibrary).toHaveBeenCalledWith(expect.objectContaining({selectionLimit: 1}));
    });

    it('reports cancellation as a distinct, silent outcome', async () => {
      mockedLaunchImageLibrary.mockResolvedValueOnce({didCancel: true});

      const result = await pickPhotoFromLibrary();

      expect(result).toEqual({status: 'cancelled'});
    });

    it('maps a denied-permission response to a "permission" error', async () => {
      mockedLaunchImageLibrary.mockResolvedValueOnce({errorCode: 'permission'});

      const result = await pickPhotoFromLibrary();

      expect(result).toEqual({status: 'error', reason: 'permission'});
    });
  });
});
