import { getIsOnline } from './useNetworkStatus';

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

import * as Network from 'expo-network';

describe('useNetworkStatus', () => {
  it('should return true when connected and internet is reachable', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValueOnce({
      isConnected: true,
      isInternetReachable: true,
    });

    const result = await getIsOnline();
    expect(result).toBe(true);
  });

  it('should return false when not connected', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    });

    const result = await getIsOnline();
    expect(result).toBe(false);
  });

  it('should return false when isInternetReachable is null', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValueOnce({
      isConnected: true,
      isInternetReachable: null,
    });

    const result = await getIsOnline();
    expect(result).toBe(false);
  });

  it('should return false when connected but internet not reachable', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValueOnce({
      isConnected: true,
      isInternetReachable: false,
    });

    const result = await getIsOnline();
    expect(result).toBe(false);
  });
});