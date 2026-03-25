import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TotpSetup } from './TotpSetup';

jest.mock('../../../lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('react-native-qrcode-svg', () => ({
  __esModule: true,
  default: () => null,
}));

import { apiClient } from '../../../lib/api-client';

describe('TotpSetup', () => {
  const onSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { totpURI: 'otpauth://totp/KURA:test@example.com?secret=ABC123' },
    });
  });

  it('should render and fetch QR code on mount', async () => {
    const { getByLabelText } = render(
      <TotpSetup sessionToken="test-token" onSuccess={onSuccess} />,
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/auth/two-factor/get-totp-uri',
        expect.objectContaining({ Authorization: 'Bearer test-token' }),
      );
    });

    await waitFor(() => {
      expect(getByLabelText("QR code d'authentification")).toBeTruthy();
    });
  });

  it('should show verify step after clicking through QR code', async () => {
    const { getByLabelText, getByText } = render(
      <TotpSetup sessionToken="test-token" onSuccess={onSuccess} />,
    );

    await waitFor(() => getByText("J'ai scanné le QR code"));
    fireEvent.press(getByLabelText("Bouton j'ai scanné le QR code"));

    expect(getByLabelText('Champ code TOTP 6 chiffres')).toBeTruthy();
  });

  it('should call verify endpoint and trigger onSuccess on valid code', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({});
    const { getByLabelText, getByText } = render(
      <TotpSetup sessionToken="test-token" onSuccess={onSuccess} />,
    );

    await waitFor(() => getByText("J'ai scanné le QR code"));
    fireEvent.press(getByLabelText("Bouton j'ai scanné le QR code"));

    const codeInput = getByLabelText('Champ code TOTP 6 chiffres');
    fireEvent.changeText(codeInput, '123456');
    fireEvent.press(getByLabelText('Bouton valider le code'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/auth/two-factor/verify-totp',
        { code: '123456' },
        expect.objectContaining({ Authorization: 'Bearer test-token' }),
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
