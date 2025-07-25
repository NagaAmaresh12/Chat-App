import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  plain: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(plain, hash);
};
