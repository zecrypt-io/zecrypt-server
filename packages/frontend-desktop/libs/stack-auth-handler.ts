import axios from './Middleware/axiosInstace';

interface StackAuthRequest {
  action: 'login' | 'two_factor_auth';
  data: {
    access_token?: string;
    user_id?: string;
    code?: string;
    device_id?: string;
  };
}

interface StackAuthResponse {
  status_code: number;
  message: string;
  data: {
    user_id?: string;
    name?: string;
    profile_url?: string;
    email?: string;
    token?: string;
    refresh_token?: string;
    language?: string;
    is_new_user?: boolean;
    provisioning_uri?: string;
    plan?: string;
  };
}

export const stackAuthHandler = async (
  access_token: string,
  action: 'login' | 'two_factor_auth',
  additionalData: { user_id?: string; code?: string; device_id?: string } = {}
): Promise<StackAuthResponse> => {
  try {
    const requestData: StackAuthRequest = {
      action,
      data: {
        access_token,
        ...additionalData,
      },
    };

    const response = await axios.post('/api/v1/web/auth/stack-auth/', requestData);
    return response.data;
  } catch (error: any) {
    console.error('Stack auth handler error:', error);
    throw error;
  }
};