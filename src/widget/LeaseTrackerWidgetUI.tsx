import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { PaceStatus, WidgetSummary } from '../native/WidgetDataBridge';

function paceColor(status: PaceStatus): `#${string}` {
  switch (status) {
    case 'over-pace':
      return '#E63D3D';
    case 'slightly-over':
      return '#F29914';
    default:
      return '#33B869';
  }
}

function paceLabel(status: PaceStatus): string {
  switch (status) {
    case 'over-pace':
      return 'Over Pace';
    case 'slightly-over':
      return 'Slightly Over';
    default:
      return 'On Track';
  }
}

interface Props {
  data: WidgetSummary;
}

export function LeaseTrackerWidgetUI({ data }: Props): React.ReactElement {
  const color = paceColor(data.paceStatus);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
      }}
      clickAction="OPEN_APP"
    >
      {/* Pace status */}
      <TextWidget
        style={{
          fontSize: 13,
          fontWeight: 'bold',
          color,
        }}
        text={paceLabel(data.paceStatus)}
      />

      {/* Miles remaining */}
      <TextWidget
        style={{
          fontSize: 22,
          fontWeight: 'bold',
          color: '#1A1A1A',
          marginTop: 4,
        }}
        text={`${data.milesRemaining.toLocaleString()} mi`}
      />
      <TextWidget
        style={{
          fontSize: 11,
          color: '#666666',
        }}
        text="remaining"
      />

      {/* Days to end */}
      <TextWidget
        style={{
          fontSize: 22,
          fontWeight: 'bold',
          color: '#1A1A1A',
          marginTop: 8,
        }}
        text={`${data.daysRemaining}`}
      />
      <TextWidget
        style={{
          fontSize: 11,
          color: '#666666',
        }}
        text="days to end"
      />

      {/* Vehicle label */}
      <TextWidget
        style={{
          fontSize: 11,
          color: '#999999',
          marginTop: 8,
        }}
        text={data.vehicleLabel}
        maxLines={1}
      />
    </FlexWidget>
  );
}
