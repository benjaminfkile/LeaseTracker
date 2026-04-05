jest.mock('react-native-config', () => ({
  COGNITO_USER_POOL_ID: 'us-east-1_TestPoolId',
  COGNITO_CLIENT_ID: 'TestClientId',
  AWS_REGION: 'us-east-1',
}));

import { cognitoConfig } from '../src/auth/cognitoConfig';

describe('cognitoConfig', () => {
  it('exposes UserPoolId from Config', () => {
    expect(cognitoConfig.UserPoolId).toBe('us-east-1_TestPoolId');
  });

  it('exposes ClientId from Config', () => {
    expect(cognitoConfig.ClientId).toBe('TestClientId');
  });

  it('exposes Region from Config', () => {
    expect(cognitoConfig.Region).toBe('us-east-1');
  });

  it('has exactly the required keys', () => {
    const keys = Object.keys(cognitoConfig);
    expect(keys).toEqual(['UserPoolId', 'ClientId', 'Region']);
  });
});
