//Access Token
export const getAccessToken = () => localStorage.getItem("accessToken");
export const setAccessToken = (accessToken: string = "") =>
  localStorage.setItem("accessToken", accessToken);

//Refresh Token
export const getRefreshToken = () => localStorage.getItem("refreshToken");
export const setRefreshToken = (refreshToken: string = "") =>
  localStorage.setItem("refreshToken", refreshToken);

export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};
