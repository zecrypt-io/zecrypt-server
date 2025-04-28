import axiosInstance from '../libs/Middleware/axiosInstace';
import { AUTH_ROUTES, API_ROUTES } from '../constants/routes';

type StackAuthAction = 'login' | 'signup' | 'two_factor_auth';

interface AuthResponse {
  status_code: number;
  message: string;
  data: {
    user_id: string;
    name?: string;
    profile_url?: string;
    token?: string;
    refresh_token?: string;
    email?: string;
    language?: string;
    is_new_user?: boolean;
    provisioning_uri?: string;
  };
}

export async function stackAuthHandler(
  uid: string,
  action: StackAuthAction,
  extraData?: { code?: string; user_id?: string; device_id?: string }
): Promise<AuthResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined in environment variables');
  }

  let endpoint: string;
  let payload: any = {};
  
  // Include UID only if provided (not needed for 2FA)
  if (uid) {
    payload.uid = uid;
  }

  // Include extra data in payload
  if (extraData) {
    payload = { ...payload, ...extraData };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // Add device ID to headers if available
  if (extraData?.device_id) {
    headers['device_id'] = extraData.device_id;
  } else {
    const storedDeviceId = localStorage.getItem('zecrypt_device_id');
    if (storedDeviceId) {
      headers['device_id'] = storedDeviceId;
    }
  }

  switch (action) {
    case 'login':
      endpoint = API_ROUTES.AUTH.LOGIN;
      break;
    case 'signup':
      endpoint = API_ROUTES.AUTH.SIGNUP;
      break;
    case 'two_factor_auth':
      endpoint = AUTH_ROUTES.TWO_FACTOR_AUTH;
      break;
    default:
      throw new Error(`Invalid action: ${action}`);
  }

  const fullUrl = `${baseUrl}${endpoint}`;
  console.log(`Sending ${action} request to: ${fullUrl}`, { payload, headers });

  try {
    const res = await axiosInstance.post(fullUrl, payload, {
      headers,
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.error(`Error during ${action}:`, error);
    throw error;
  }
}