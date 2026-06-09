export const PASSWORD_REQUIREMENTS = [
  { key: 'minLength', label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { key: 'lowercase', label: 'Al menos 1 minúscula', test: (p) => /[a-z]/.test(p) },
  { key: 'uppercase', label: 'Al menos 1 mayúscula', test: (p) => /[A-Z]/.test(p) },
  { key: 'special', label: 'Al menos 1 carácter especial (!@#$%&*)', test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

export function validatePasswordPolicy(password) {
  const checks = PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    passed: req.test(password),
  }));

  return {
    checks,
    isValid: checks.every((c) => c.passed),
  };
}

export function getPasswordPolicyError(password) {
  const { checks, isValid } = validatePasswordPolicy(password);
  if (isValid) return null;

  const failed = checks.filter((c) => !c.passed).map((c) => c.label.toLowerCase());
  return `La contraseña debe cumplir: ${failed.join(', ')}.`;
}
