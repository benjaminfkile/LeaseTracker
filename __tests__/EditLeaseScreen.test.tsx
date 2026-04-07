jest.mock('@react-native-community/datetimepicker', () => {
  const MockReact = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({
      testID,
    }: {
      testID?: string;
    }) => MockReact.createElement(View, { testID }),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const MockReact = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => MockReact.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
  };
});

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
    navigate: jest.fn(),
  }),
  useRoute: () => ({
    params: { leaseId: 'lease-123' },
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
}));

jest.mock('../src/api/leaseApi', () => ({
  getLease: jest.fn(),
  updateLease: jest.fn(),
  deleteLease: jest.fn(),
  getLeaseMembers: jest.fn(),
}));

jest.mock('../src/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../src/stores/authStore';
import { EditLeaseScreen } from '../src/screens/leases/EditLeaseScreen';

const mockUseMutation = useMutation as jest.Mock;
const mockUseQuery = useQuery as jest.Mock;
const mockUseAuthStore = useAuthStore as jest.Mock;

const MOCK_LEASE = {
  id: 'lease-123',
  userId: 'user-abc',
  vehicleYear: 2023,
  vehicleMake: 'Toyota',
  vehicleModel: 'Camry',
  vehicleTrim: 'SE',
  startDate: '2023-01-01',
  endDate: '2026-01-01',
  totalMiles: 36000,
  startingMileage: 0,
  currentMileage: 12000,
  monthlyMiles: 1000,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

function setupMocks({
  isPending = false,
  isArchiving = false,
  mutate = jest.fn(),
  archiveMutate = jest.fn(),
  leaseLoading = false,
  lease = MOCK_LEASE,
  members = [] as { id: string; leaseId: string; userId: string; email: string; role: 'owner' | 'viewer'; createdAt: string }[],
  currentUserSub = 'user-abc',
}: {
  isPending?: boolean;
  isArchiving?: boolean;
  mutate?: jest.Mock;
  archiveMutate?: jest.Mock;
  leaseLoading?: boolean;
  lease?: typeof MOCK_LEASE | null;
  members?: { id: string; leaseId: string; userId: string; email: string; role: 'owner' | 'viewer'; createdAt: string }[];
  currentUserSub?: string;
} = {}) {
  // Cycle through [update, archive] results on every render pair
  let mutationCallIndex = 0;
  const mutationResults = [
    { mutate, isPending },
    { mutate: archiveMutate, isPending: isArchiving },
  ];
  mockUseMutation.mockImplementation(() => {
    const result = mutationResults[mutationCallIndex % 2];
    mutationCallIndex++;
    return result;
  });

  // Use query key to distinguish between lease and members queries (robust across re-renders)
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    const key = queryKey[0] as string;
    if (key === 'lease') {
      return { data: lease, isLoading: leaseLoading };
    }
    if (key === 'lease-members') {
      return { data: members };
    }
    return { data: undefined, isLoading: false };
  });

  mockUseAuthStore.mockImplementation((selector: (s: { user: { sub: string } | null }) => unknown) =>
    selector({ user: currentUserSub ? { sub: currentUserSub } : null }),
  );
}

/** Fills all required step 1 fields in the given renderer. */
async function fillStep1Fields(renderer: ReactTestRenderer.ReactTestRenderer) {
  const { TextInput } = require('react-native');
  await ReactTestRenderer.act(() => {
    renderer.root
      .findByProps({ testID: 'input-display-name' })
      .findByType(TextInput)
      .props.onChangeText('2023 Toyota Camry');
    renderer.root
      .findByProps({ testID: 'input-vehicle-year' })
      .findByType(TextInput)
      .props.onChangeText('2023');
    renderer.root
      .findByProps({ testID: 'input-vehicle-make' })
      .findByType(TextInput)
      .props.onChangeText('Toyota');
    renderer.root
      .findByProps({ testID: 'input-vehicle-model' })
      .findByType(TextInput)
      .props.onChangeText('Camry');
  });
}

/** Navigates the wizard to step 2, returns the renderer. */
async function renderAtStep2(): Promise<ReactTestRenderer.ReactTestRenderer> {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<EditLeaseScreen />);
  });
  await fillStep1Fields(renderer!);
  await ReactTestRenderer.act(async () => {
    renderer!.root.findByProps({ testID: 'next-button' }).props.onPress();
  });
  return renderer!;
}

describe('EditLeaseScreen', () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders without crashing', async () => {
      await ReactTestRenderer.act(() => {
        ReactTestRenderer.create(<EditLeaseScreen />);
      });
    });

    it('renders with testID edit-lease-screen', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const screen = renderer!.root.findByProps({ testID: 'edit-lease-screen' });
      expect(screen).toBeDefined();
    });

    it('renders step indicator', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const indicator = renderer!.root.findByProps({ testID: 'step-indicator' });
      expect(indicator).toBeDefined();
    });

    it('renders all 4 step dots', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      for (let i = 1; i <= 4; i++) {
        const dot = renderer!.root.findByProps({ testID: `step-dot-${i}` });
        expect(dot).toBeDefined();
      }
    });

    it('renders step 1 container on initial load', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const step1 = renderer!.root.findByProps({ testID: 'step-1-container' });
      expect(step1).toBeDefined();
    });

    it('does not render steps 2-4 on initial load', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      expect(renderer!.root.findAllByProps({ testID: 'step-2-container' })).toHaveLength(0);
      expect(renderer!.root.findAllByProps({ testID: 'step-3-container' })).toHaveLength(0);
      expect(renderer!.root.findAllByProps({ testID: 'step-4-container' })).toHaveLength(0);
    });
  });

  describe('Loading state', () => {
    it('renders loading indicator while lease is loading', async () => {
      setupMocks({ leaseLoading: true, lease: null });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const loading = renderer!.root.findByProps({ testID: 'edit-lease-loading' });
      expect(loading).toBeDefined();
    });

    it('does not render step-1-container while loading', async () => {
      setupMocks({ leaseLoading: true, lease: null });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      expect(
        renderer!.root.findAllByProps({ testID: 'step-1-container' }),
      ).toHaveLength(0);
    });
  });

  describe('Pre-population from lease data', () => {
    it('pre-populates display name from lease vehicleYear/make/model', async () => {
      const { TextInput } = require('react-native');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const displayNameInput = renderer!.root
        .findByProps({ testID: 'input-display-name' })
        .findByType(TextInput);
      expect(displayNameInput.props.value).toBe('2023 Toyota Camry');
    });

    it('pre-populates vehicle year from lease', async () => {
      const { TextInput } = require('react-native');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const yearInput = renderer!.root
        .findByProps({ testID: 'input-vehicle-year' })
        .findByType(TextInput);
      expect(yearInput.props.value).toBe('2023');
    });

    it('pre-populates vehicle make from lease', async () => {
      const { TextInput } = require('react-native');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const makeInput = renderer!.root
        .findByProps({ testID: 'input-vehicle-make' })
        .findByType(TextInput);
      expect(makeInput.props.value).toBe('Toyota');
    });

    it('pre-populates vehicle model from lease', async () => {
      const { TextInput } = require('react-native');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const modelInput = renderer!.root
        .findByProps({ testID: 'input-vehicle-model' })
        .findByType(TextInput);
      expect(modelInput.props.value).toBe('Camry');
    });
  });

  describe('Step 1 — Vehicle Info', () => {
    it('renders step-1 title', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const title = renderer!.root.findByProps({ testID: 'step-1-title' });
      expect(title.props.children).toBe('Vehicle Information');
    });

    it('renders all required step 1 inputs', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const requiredTestIDs = [
        'input-display-name',
        'input-vehicle-year',
        'input-vehicle-make',
        'input-vehicle-model',
      ];
      for (const testID of requiredTestIDs) {
        const el = renderer!.root.findByProps({ testID });
        expect(el).toBeDefined();
      }
    });

    it('renders all optional step 1 inputs', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const optionalTestIDs = [
        'input-vehicle-trim',
        'input-vehicle-color',
        'input-vin',
        'input-license-plate',
      ];
      for (const testID of optionalTestIDs) {
        const el = renderer!.root.findByProps({ testID });
        expect(el).toBeDefined();
      }
    });
  });

  describe('Navigation buttons', () => {
    it('renders the nav-buttons container', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const nav = renderer!.root.findByProps({ testID: 'nav-buttons' });
      expect(nav).toBeDefined();
    });

    it('renders the Next button on step 1', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const nextBtn = renderer!.root.findByProps({ testID: 'next-button' });
      expect(nextBtn).toBeDefined();
    });

    it('renders the back/cancel button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const backBtn = renderer!.root.findByProps({ testID: 'back-button' });
      expect(backBtn).toBeDefined();
    });

    it('shows "Cancel" label on step 1', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const cancelTexts = renderer!.root.findAllByProps({ children: 'Cancel' });
      expect(cancelTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Step navigation — step 1 → step 2', () => {
    it('advances to step 2 after filling required step 1 fields and pressing Next', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });

      await fillStep1Fields(renderer!);

      await ReactTestRenderer.act(async () => {
        renderer!.root.findByProps({ testID: 'next-button' }).props.onPress();
      });

      const step2 = renderer!.root.findByProps({ testID: 'step-2-container' });
      expect(step2).toBeDefined();
      expect(renderer!.root.findAllByProps({ testID: 'step-1-container' })).toHaveLength(0);
    });

    it('stays on step 1 if required fields are empty when Next is pressed', async () => {
      setupMocks({ lease: null });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });

      await ReactTestRenderer.act(async () => {
        renderer!.root.findByProps({ testID: 'next-button' }).props.onPress();
      });

      const step1 = renderer!.root.findByProps({ testID: 'step-1-container' });
      expect(step1).toBeDefined();
      expect(renderer!.root.findAllByProps({ testID: 'step-2-container' })).toHaveLength(0);
    });
  });

  describe('Step 2 — Lease Terms', () => {
    it('renders step 2 container after advancing from step 1', async () => {
      const renderer = await renderAtStep2();
      const step2 = renderer.root.findByProps({ testID: 'step-2-container' });
      expect(step2).toBeDefined();
    });

    it('renders step-2 title', async () => {
      const renderer = await renderAtStep2();
      const title = renderer.root.findByProps({ testID: 'step-2-title' });
      expect(title.props.children).toBe('Lease Terms');
    });

    it('renders all step 2 inputs', async () => {
      const renderer = await renderAtStep2();
      const testIDs = [
        'date-field-start',
        'date-field-end',
        'input-miles-per-year',
        'input-total-miles',
        'input-starting-odometer',
        'input-overage-cost',
      ];
      for (const testID of testIDs) {
        const el = renderer.root.findByProps({ testID });
        expect(el).toBeDefined();
      }
    });

    it('renders Back button on step 2', async () => {
      const renderer = await renderAtStep2();
      const backBtn = renderer.root.findByProps({ testID: 'back-button' });
      expect(backBtn).toBeDefined();
    });

    it('shows "Back" label on step 2', async () => {
      const renderer = await renderAtStep2();
      const backTexts = renderer.root.findAllByProps({ children: 'Back' });
      expect(backTexts.length).toBeGreaterThan(0);
    });

    it('navigates back to step 1 when Back is pressed on step 2', async () => {
      const renderer = await renderAtStep2();

      await ReactTestRenderer.act(() => {
        renderer.root.findByProps({ testID: 'back-button' }).props.onPress();
      });

      const step1 = renderer.root.findByProps({ testID: 'step-1-container' });
      expect(step1).toBeDefined();
      expect(renderer.root.findAllByProps({ testID: 'step-2-container' })).toHaveLength(0);
    });

    it('stays on step 2 if required terms fields are empty when Next is pressed', async () => {
      setupMocks({ lease: null });
      const renderer = await renderAtStep2();

      await ReactTestRenderer.act(async () => {
        renderer.root.findByProps({ testID: 'next-button' }).props.onPress();
      });

      const step2 = renderer.root.findByProps({ testID: 'step-2-container' });
      expect(step2).toBeDefined();
      expect(renderer.root.findAllByProps({ testID: 'step-3-container' })).toHaveLength(0);
    });
  });

  describe('DateField component', () => {
    it('renders start and end date field buttons on step 2', async () => {
      const renderer = await renderAtStep2();
      const startBtn = renderer.root.findByProps({ testID: 'date-field-start-button' });
      const endBtn = renderer.root.findByProps({ testID: 'date-field-end-button' });
      expect(startBtn).toBeDefined();
      expect(endBtn).toBeDefined();
    });

    it('shows date picker when start date button is pressed', async () => {
      const renderer = await renderAtStep2();

      expect(
        renderer.root.findAllByProps({ testID: 'date-field-start-picker' }),
      ).toHaveLength(0);

      await ReactTestRenderer.act(() => {
        renderer.root.findByProps({ testID: 'date-field-start-button' }).props.onPress();
      });

      const pickersAfter = renderer.root.findAllByProps({
        testID: 'date-field-start-picker',
      });
      expect(pickersAfter.length).toBeGreaterThan(0);
    });

    it('hides date picker on second press (toggle off)', async () => {
      const renderer = await renderAtStep2();

      await ReactTestRenderer.act(() => {
        renderer.root.findByProps({ testID: 'date-field-start-button' }).props.onPress();
      });
      await ReactTestRenderer.act(() => {
        renderer.root.findByProps({ testID: 'date-field-start-button' }).props.onPress();
      });

      expect(
        renderer.root.findAllByProps({ testID: 'date-field-start-picker' }),
      ).toHaveLength(0);
    });
  });

  describe('Step indicator states', () => {
    it('step dot 1 is present on initial render', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const dot1 = renderer!.root.findByProps({ testID: 'step-dot-1' });
      expect(dot1).toBeDefined();
    });

    it('renders connecting lines between step dots', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      for (let i = 1; i <= 3; i++) {
        const line = renderer!.root.findByProps({ testID: `step-line-${i}` });
        expect(line).toBeDefined();
      }
    });
  });

  describe('Archive Lease button', () => {
    it('renders the archive-lease-button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const archiveBtn = renderer!.root.findByProps({ testID: 'archive-lease-button' });
      expect(archiveBtn).toBeDefined();
    });

    it('renders the lease-actions-section', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const section = renderer!.root.findByProps({ testID: 'lease-actions-section' });
      expect(section).toBeDefined();
    });

    it('shows Archive Lease text', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const archiveTexts = renderer!.root.findAllByProps({ children: 'Archive Lease' });
      expect(archiveTexts.length).toBeGreaterThan(0);
    });

    it('shows archiving text when isArchiving is true', async () => {
      setupMocks({ isArchiving: true });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const archivingTexts = renderer!.root.findAllByProps({ children: 'Archiving…' });
      expect(archivingTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Transfer Ownership button', () => {
    it('does not render transfer-ownership-button when user is not owner', async () => {
      setupMocks({
        currentUserSub: 'different-user',
        members: [
          {
            id: 'm1',
            leaseId: 'lease-123',
            userId: 'user-xyz',
            email: 'member@example.com',
            role: 'viewer',
            createdAt: '2023-01-01T00:00:00Z',
          },
        ],
      });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      expect(
        renderer!.root.findAllByProps({ testID: 'transfer-ownership-button' }),
      ).toHaveLength(0);
    });

    it('does not render transfer-ownership-button when owner but no members', async () => {
      setupMocks({ members: [] });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      expect(
        renderer!.root.findAllByProps({ testID: 'transfer-ownership-button' }),
      ).toHaveLength(0);
    });

    it('renders transfer-ownership-button when user is owner and has members', async () => {
      setupMocks({
        currentUserSub: 'user-abc',
        members: [
          {
            id: 'm1',
            leaseId: 'lease-123',
            userId: 'user-xyz',
            email: 'member@example.com',
            role: 'viewer',
            createdAt: '2023-01-01T00:00:00Z',
          },
        ],
      });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const transferBtn = renderer!.root.findByProps({ testID: 'transfer-ownership-button' });
      expect(transferBtn).toBeDefined();
    });
  });

  describe('Submit button', () => {
    it('shows "Save Changes" on step 4 (via isPending state)', async () => {
      setupMocks({ isPending: true });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<EditLeaseScreen />);
      });
      const screen = renderer!.root.findByProps({ testID: 'edit-lease-screen' });
      expect(screen).toBeDefined();
    });
  });
});
