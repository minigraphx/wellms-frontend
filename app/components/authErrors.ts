// The SDK resolves failed requests with umi-request's error; its `data` holds the API body,
// e.g. { message: "Email not validated" } from POST /api/auth/login.
type ApiResult = { data?: { message?: string } } | null | undefined;

const EMAIL_NOT_CONFIRMED = "Email not validated";
const ACCOUNT_DEACTIVATED = "User account has been deactivated";

const apiMessage = (res: unknown) => (res as ApiResult)?.data?.message;

export const isEmailNotConfirmed = (res: unknown) => apiMessage(res) === EMAIL_NOT_CONFIRMED;

export function loginErrorMessage(res: unknown): string {
  switch (apiMessage(res)) {
    case EMAIL_NOT_CONFIRMED:
      return "Please confirm your email address first, using the link in the email we sent you after registration.";
    case ACCOUNT_DEACTIVATED:
      return "This account has been deactivated. Please contact us.";
    default:
      return "Invalid email or password.";
  }
}
