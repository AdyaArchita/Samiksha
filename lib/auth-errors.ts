const loginErrorMessages: Record<string, string> = {
  invalid_credentials: "Email or password is incorrect.",
  sign_out_failed: "We couldn't sign you out. Please try again.",
};

export function getLoginErrorMessage(code?: string): string | null {
  if (!code) return null;
  return loginErrorMessages[code] ?? "We couldn't complete that request. Please try again.";
}
