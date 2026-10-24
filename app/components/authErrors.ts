// The SDK resolves failed requests with umi-request's error; its `data` holds the API body,
// e.g. { message: "Email not validated" } from POST /api/auth/login.
type ApiResult = { data?: { message?: string } } | null | undefined;

const EMAIL_NOT_CONFIRMED = "Email not validated";
const ACCOUNT_DEACTIVATED = "User account has been deactivated";

const apiMessage = (res: unknown) => (res as ApiResult)?.data?.message;

export const isEmailNotConfirmed = (res: unknown) => apiMessage(res) === EMAIL_NOT_CONFIRMED;

// Key of the message in the `auth` dictionary: t.auth[loginErrorKey(res)].
export type LoginErrorKey = "emailNotConfirmed" | "accountDeactivated" | "invalidCredentials";

export function loginErrorKey(res: unknown): LoginErrorKey {
  switch (apiMessage(res)) {
    case EMAIL_NOT_CONFIRMED:
      return "emailNotConfirmed";
    case ACCOUNT_DEACTIVATED:
      return "accountDeactivated";
    default:
      return "invalidCredentials";
  }
}
