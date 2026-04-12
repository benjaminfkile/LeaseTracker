import client, { normalizeError } from './client';
import type { SubscriptionStatus } from '../types/api';

export async function verifyApplePurchase(receiptData: string): Promise<SubscriptionStatus> {
  try {
    const response = await client.post<SubscriptionStatus>('/api/subscriptions/apple/verify', {
      receiptData,
    });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function verifyGooglePurchase(
  productId: string,
  purchaseToken: string,
): Promise<SubscriptionStatus> {
  try {
    const response = await client.post<SubscriptionStatus>('/api/subscriptions/google/verify', {
      productId,
      purchaseToken,
    });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getStatus(): Promise<SubscriptionStatus> {
  try {
    const response = await client.get<SubscriptionStatus>('/api/subscriptions/status');
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}
