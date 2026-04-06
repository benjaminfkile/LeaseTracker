jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../src/api/subscriptionApi', () => ({
  getStatus: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AppState } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '../src/hooks/useSubscription';
import type { SubscriptionStatus } from '../src/types/api';

const mockUseQuery = useQuery as jest.Mock;
const mockUseQueryClient = useQueryClient as jest.Mock;

const mockInvalidateQueries = jest.fn();

type HookRef = {
  isPremium: boolean;
  expiresAt: string | null;
  isLoading: boolean;
};

function TestHookComponent({ onRender }: { onRender: (result: HookRef) => void }) {
  const result = useSubscription();
  onRender(result);
  return null;
}

const mockPremium: SubscriptionStatus = {
  isPremium: true,
  tier: 'premium',
  expiresAt: '2027-01-01T00:00:00Z',
  platform: 'ios',
  productId: 'com.leasetracker.premium.monthly',
};

const mockFree: SubscriptionStatus = {
  isPremium: false,
  tier: 'free',
  expiresAt: null,
  platform: null,
  productId: null,
};

describe('useSubscription', () => {
  let mockRemove: jest.Mock;
  let mockAddEventListener: jest.SpyInstance;
  let capturedAppStateCallback: ((nextState: string) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRemove = jest.fn();
    capturedAppStateCallback = undefined;

    mockAddEventListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, callback) => {
        capturedAppStateCallback = callback as (nextState: string) => void;
        return { remove: mockRemove };
      });

    mockUseQueryClient.mockReturnValue({ invalidateQueries: mockInvalidateQueries });
  });

  afterEach(() => {
    mockAddEventListener.mockRestore();
  });

  describe('returned values', () => {
    it('returns isPremium=false and expiresAt=null when data is undefined (loading)', async () => {
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });

      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      expect(latest!.isPremium).toBe(false);
      expect(latest!.expiresAt).toBeNull();
      expect(latest!.isLoading).toBe(true);
    });

    it('returns isPremium=true and expiresAt when subscription is premium', async () => {
      mockUseQuery.mockReturnValue({ data: mockPremium, isLoading: false });

      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      expect(latest!.isPremium).toBe(true);
      expect(latest!.expiresAt).toBe('2027-01-01T00:00:00Z');
      expect(latest!.isLoading).toBe(false);
    });

    it('returns isPremium=false and expiresAt=null when subscription is free tier', async () => {
      mockUseQuery.mockReturnValue({ data: mockFree, isLoading: false });

      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      expect(latest!.isPremium).toBe(false);
      expect(latest!.expiresAt).toBeNull();
      expect(latest!.isLoading).toBe(false);
    });

    it('returns isLoading=true while the query is in flight', async () => {
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });

      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      expect(latest!.isLoading).toBe(true);
    });

    it('returns isLoading=false once the query resolves', async () => {
      mockUseQuery.mockReturnValue({ data: mockFree, isLoading: false });

      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      expect(latest!.isLoading).toBe(false);
    });
  });

  describe('useQuery configuration', () => {
    it('calls useQuery with the subscription-status query key', async () => {
      mockUseQuery.mockReturnValue({ data: mockFree, isLoading: false });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['subscription-status'] }),
      );
    });

    it('calls useQuery with getStatus as queryFn', async () => {
      mockUseQuery.mockReturnValue({ data: mockFree, isLoading: false });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });

      const call = mockUseQuery.mock.calls[0][0];
      expect(typeof call.queryFn).toBe('function');
    });
  });

  describe('AppState foreground re-fetch', () => {
    it('registers a change listener on AppState when mounted', async () => {
      mockUseQuery.mockReturnValue({ data: mockFree, isLoading: false });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('calls invalidateQueries when app transitions from background to active', async () => {
      mockUseQuery.mockReturnValue({ data: mockFree, isLoading: false });

      // Simulate the app currently being in background
      Object.defineProperty(AppState, 'currentState', { value: 'background', writable: true });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });

      await ReactTestRenderer.act(async () => {
        capturedAppStateCallback!('active');
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['subscription-status'],
      });

      Object.defineProperty(AppState, 'currentState', { value: 'active', writable: true });
    });

    it('does not call invalidateQueries when app stays in active state', async () => {
      mockUseQuery.mockReturnValue({ data: mockFree, isLoading: false });

      // Simulate app already active
      Object.defineProperty(AppState, 'currentState', { value: 'active', writable: true });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });

      await ReactTestRenderer.act(async () => {
        capturedAppStateCallback!('active');
      });

      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });

    it('does not call invalidateQueries when app goes to background', async () => {
      mockUseQuery.mockReturnValue({ data: mockFree, isLoading: false });

      Object.defineProperty(AppState, 'currentState', { value: 'active', writable: true });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });

      await ReactTestRenderer.act(async () => {
        capturedAppStateCallback!('background');
      });

      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });

    it('removes the AppState listener on unmount', async () => {
      mockUseQuery.mockReturnValue({ data: mockFree, isLoading: false });

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });

      await ReactTestRenderer.act(async () => {
        renderer!.unmount();
      });

      expect(mockRemove).toHaveBeenCalled();
    });
  });
});
