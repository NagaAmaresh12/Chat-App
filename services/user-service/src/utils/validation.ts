export const isEmailValid = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
};

export const isUsernameValid = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

export const isValid = (variable: string | number): boolean => {
  return variable !== undefined && variable !== null;
};
