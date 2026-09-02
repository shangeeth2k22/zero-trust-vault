import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

/**
 * Checks if biometric sensors (FaceID, TouchID, or Android BiometricPrompt) are available on the device.
 */
export const checkBiometricAvailability = async (): Promise<{ available: boolean; biometryType?: string }> => {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return { available, biometryType };
  } catch (error) {
    console.error('Biometric sensor check error:', error);
    return { available: false };
  }
};

/**
 * Prompts the user for biometric authentication with system prompt: "Unlock Zero-Trust Vault".
 * Returns true if authentication succeeded, false otherwise.
 */
export const authenticateUser = async (): Promise<boolean> => {
  try {
    const { available } = await checkBiometricAvailability();
    if (!available) {
      console.log('Biometrics not available on this device');
      return false;
    }

    const result = await rnBiometrics.simplePrompt({
      promptMessage: 'Unlock Zero-Trust Vault',
      cancelButtonText: 'Cancel'
    });

    return result.success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
};
