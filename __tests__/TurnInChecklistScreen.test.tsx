import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TurnInChecklistScreen } from '../src/screens/leases/TurnInChecklistScreen';

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const MockReact = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: (props: { name: string; testID?: string }) =>
      MockReact.createElement(Text, { testID: props.testID }, props.name),
  };
});

jest.mock('react-native-view-shot', () => {
  const MockReact = require('react');
  const { View } = require('react-native');
  const ViewShot = MockReact.forwardRef(
    (props: { children: React.ReactNode }, ref: React.Ref<unknown>) => {
      MockReact.useImperativeHandle(ref, () => ({}));
      return MockReact.createElement(View, null, props.children);
    },
  );
  ViewShot.displayName = 'ViewShot';
  return {
    __esModule: true,
    default: ViewShot,
    captureRef: jest.fn(),
  };
});

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
  useRoute: () => ({ params: { leaseId: 'test-lease-id' } }),
}));

describe('TurnInChecklistScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<TurnInChecklistScreen />);
    });
  });

  it('renders with testID turn-in-checklist-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TurnInChecklistScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'turn-in-checklist-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Turn-In Checklist title in the header', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TurnInChecklistScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'screen-header-title' });
    expect(title).toBeDefined();
    expect(title.props.children).toBe('Turn-In Checklist');
  });

  it('renders all 6 checklist categories', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TurnInChecklistScreen />);
    });
    const categories = [
      'exterior', 'interior', 'tires', 'windshield', 'wear', 'keys',
    ];
    for (const id of categories) {
      const cat = renderer!.root.findByProps({ testID: `checklist-category-${id}` });
      expect(cat).toBeDefined();
    }
  });

  it('renders the progress indicator', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TurnInChecklistScreen />);
    });
    const progress = renderer!.root.findByProps({ testID: 'checklist-progress' });
    expect(progress).toBeDefined();
  });

  it('renders the generate report button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TurnInChecklistScreen />);
    });
    const button = renderer!.root.findByProps({ testID: 'generate-report-button' });
    expect(button).toBeDefined();
  });

  it('renders checklist items for the expanded category', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TurnInChecklistScreen />);
    });
    // Exterior is expanded by default
    const paintItem = renderer!.root.findByProps({ testID: 'checklist-item-ext-paint' });
    expect(paintItem).toBeDefined();
  });

  it('renders status buttons for each checklist item', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TurnInChecklistScreen />);
    });
    const okButton = renderer!.root.findByProps({ testID: 'checklist-status-ext-paint-ok' });
    const minorButton = renderer!.root.findByProps({ testID: 'checklist-status-ext-paint-minor' });
    const damageButton = renderer!.root.findByProps({ testID: 'checklist-status-ext-paint-damage' });
    expect(okButton).toBeDefined();
    expect(minorButton).toBeDefined();
    expect(damageButton).toBeDefined();
  });

  it('renders add photo button for each checklist item', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TurnInChecklistScreen />);
    });
    const addPhoto = renderer!.root.findByProps({ testID: 'checklist-add-photo-ext-paint' });
    expect(addPhoto).toBeDefined();
  });
});
