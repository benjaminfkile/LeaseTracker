import React from 'react';

type Props = {
  children: React.ReactNode;
};

export function PremiumGate({ children }: Props): React.ReactElement {
  return <>{children}</>;
}
