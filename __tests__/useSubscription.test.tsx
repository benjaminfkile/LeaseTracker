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

type HookResult = {
  isPremium: boolean;
  expiresAt: string | null;
  isLoading: boolean;
};

function TestHookComponent({ onRender }: { onRender: (result: HookResult) => void }) {
  const result = useSubscription();
  onRender(result);
  return null;
}

function makeQueryClient(overrides: Partial<{ invalidateQueries: jest.Mock }> = {}) {
  return {
    invalidateQueries: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('useSubscription', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let capturedHandler: ((state: string) => void) | null = null;
  const removeMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    capturedHandler = null;

    addEventListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, handler) => {
        capturedHandler = handler as (state: string) => void;
        return { remove: removeMock };
      });

    mockUseQueryClient.mockReturnValue(makeQueryClient());
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
  });

  describe('return values', () => {
    it('returns isPremium=false, expiresAt=null, isLoading=true while loading', async () => {
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
      let latest: HookResult | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });
      expect(latest!.isPremium).toBe(false);
      expect(latest!.expiresAt).toBeNull();
      expect(latest!.isLoading).toBe(true);
    });

    it('returns isPremium=true and expiresAt when subscription is active', async () => {
      const status: SubscriptionStatus = {
        isPremium: true,
        tier: 'premium',
        expiresAt: '2027-01-01T00:00:00.000Z',
        platform: 'ios',
        productId: 'com.example.premium',
      };
      mockUseQuery.mockReturnValue({ data: status, isLoading: false });
      let latest: HookResult | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });
      expect(latest!.isPremium).toBe(true);
      expect(latest!.expiresAt).toBe('2027-01-01T00:00:00.000Z');
      expect(latest!.isLoading).toBe(false);
    });

    it('returns isPremium=false and expiresAt=null for free tier', async () => {
      const status: SubscriptionStatus = {
        isPremium: false,
        tier: 'free',
        expiresAt: null,
        platform: null,
        productId: null,
      };
      mockUseQuery.mockReturnValue({ data: status, isLoading: false });
      let latest: HookResult | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });
      expect(latest!.isPremium).toBe(false);
      expect(latest!.expiresAt).toBeNull();
      expect(latest!.isLoading).toBe(false);
    });
  });

  describe('TanStack Query configuration', () => {
    it('calls useQuery with the subscription-status query key and getStatus as queryFn', async () => {
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['subscription-status'],
          queryFn: expect.any(Function),
        }),
      );
    });
  });

  describe('AppState foreground re-fetch', () => {
    it('registers an AppState change listener on mount', async () => {
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });
      expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('invalidates subscription-status query when app transitions from background to active', async () => {
      const invalidateQueries = jest.fn().mockResolvedValue(undefined);
      mockUseQueryClient.mockReturnValue(makeQueryClient({ invalidateQueries }));
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });

      // Simulate background → active transition
      await ReactTestRenderer.act(async () => {
        capturedHandler!('background');
      });
      await ReactTestRenderer.act(async () => {
        capturedHandler!('active');
      });

      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['subscription-status'],
      });
    });

    it('invalidates subscription-status query when app transitions from inactive to active', async () => {
      const invalidateQueries = jest.fn().mockResolvedValue(undefined);
      mockUseQueryClient.mockReturnValue(makeQueryClient({ invalidateQueries }));
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });

      // Simulate inactive → active transition
      await ReactTestRenderer.act(async () => {
        capturedHandler!('inactive');
      });
      await ReactTestRenderer.act(async () => {
        capturedHandler!('active');
      });

      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['subscription-status'],
      });
    });

    it('does NOT invalidate when app stays active', async () => {
      const invalidateQueries = jest.fn().mockResolvedValue(undefined);
      mockUseQueryClient.mockReturnValue(makeQueryClient({ invalidateQueries }));
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });

      // active → active: no invalidation expected
      await ReactTestRenderer.act(async () => {
        capturedHandler!('active');
      });

      expect(invalidateQueries).not.toHaveBeenCalled();
    });

    it('removes the AppState listener on unmount', async () => {
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });
      await ReactTestRenderer.act(async () => {
        renderer!.unmount();
      });
      expect(removeMock).toHaveBeenCalled();
    });
  });
});
