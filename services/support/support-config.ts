export function getAlphaSupportEmail() {
  const supportEmail = process.env.ALPHA_SUPPORT_EMAIL?.trim();

  if (!supportEmail || !isSimpleEmail(supportEmail)) {
    return null;
  }

  return supportEmail;
}

function isSimpleEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
