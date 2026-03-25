import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PasskeySetup } from './PasskeySetup';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
}));

import * as LocalAuthentication from 'expo-local-authentication';

describe('PasskeySetup', () => {
  const onSuccess = jest.fn();
  const onSkip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
  });

  it('should call authenticateAsync and trigger onSuccess on biometric success', async () => {
    const { getByLabelText } = render(
      <PasskeySetup onSuccess={onSuccess} onSkip={onSkip} />,
    );

    await waitFor(() => getByLabelText('Bouton configurer la biométrie'));
    fireEvent.press(getByLabelText('Bouton configurer la biométrie'));

    await waitFor(() => {
      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should show skip option when biometrics not available', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);

    const { getByLabelText } = render(
      <PasskeySetup onSuccess={onSuccess} onSkip={onSkip} />,
    );

    await waitFor(() => getByLabelText('Bouton passer cette étape'));
    fireEvent.press(getByLabelText('Bouton passer cette étape'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('should show error on biometric failure', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: false });

    const { getByLabelText, getByText } = render(
      <PasskeySetup onSuccess={onSuccess} onSkip={onSkip} />,
    );

    await waitFor(() => getByLabelText('Bouton configurer la biométrie'));
    fireEvent.press(getByLabelText('Bouton configurer la biométrie'));

    await waitFor(() => {
      expect(getByText('Authentification biométrique échouée. Veuillez réessayer.')).toBeTruthy();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
