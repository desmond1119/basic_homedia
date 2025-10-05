import { createAsyncThunk } from '@reduxjs/toolkit';
import { ProviderRepository } from '../infrastructure/ProviderRepository';
import { UpdateProviderProfileData, ProviderProfile } from '../domain/Provider.types';

const providerRepository = new ProviderRepository();

export const updateProviderWithLogo = createAsyncThunk<
  ProviderProfile,
  { providerId: string; data: UpdateProviderProfileData; logoFile: File | null },
  { rejectValue: Error }
>(
  'provider/updateWithLogo',
  async ({ providerId, data, logoFile }, { rejectWithValue }) => {
    try {
      if (logoFile) {
        const logoResult = await providerRepository.uploadLogo(providerId, logoFile);
        if (logoResult.isFailure()) {
          return rejectWithValue(logoResult.getError());
        }
      }

      const updateResult = await providerRepository.updateProfile(providerId, data);
      if (updateResult.isFailure()) {
        return rejectWithValue(updateResult.getError());
      }

      const profile = updateResult.getValue();
      if (!profile) {
        return rejectWithValue(new Error('Profile not found after update'));
      }

      return profile;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
);
