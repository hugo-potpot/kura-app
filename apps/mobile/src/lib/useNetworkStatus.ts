import * as Network from 'expo-network';

export async function getIsOnline(): Promise<boolean> {
  const state = await Network.getNetworkStateAsync();
  return (state.isConnected ?? false) && (state.isInternetReachable ?? false);
}