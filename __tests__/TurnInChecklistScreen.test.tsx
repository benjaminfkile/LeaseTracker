import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TurnInChecklistScreen } from '../src/screens/leases/TurnInChecklistScreen';

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

  it('renders the Turn-In Checklist title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TurnInChecklistScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'turn-in-checklist-title' });
    expect(title).toBeDefined();
  });
});
