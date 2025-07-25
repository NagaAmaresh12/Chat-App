export const generateOTP = (length: number = 4): string => {
  console.log("Generating OTP....");

  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

export const verifyStoredOTP = async () => {};
