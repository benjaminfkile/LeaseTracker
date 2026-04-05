import Config from 'react-native-config';

export const cognitoConfig = {
  UserPoolId: Config.COGNITO_USER_POOL_ID,
  ClientId: Config.COGNITO_CLIENT_ID,
  Region: Config.AWS_REGION,
};
