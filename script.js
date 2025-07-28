const cookies = [
  "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzNGIzYWUxZGYzNTRmNjkzNDlkYTkiLCJlbWFpbCI6ImpvaG5Eb2VAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzUzNzAzMjE2LCJleHAiOjE3NTM3MDQxMTZ9.rbe62lndgDo204FXORSM6sfaYB3duQRvu1Arlc3l8PA; Max-Age=900; Path=/; Expires=Mon, 28 Jul 2025 12:01:56 GMT; HttpOnly; SameSite=Lax",
  "refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzNGIzYWUxZGYzNTRmNjkzNDlkYTkiLCJlbWFpbCI6ImpvaG5Eb2VAZXhhbXBsZS5jb20iLCJ0b2tlblR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzUzNzAzMjE2LCJleHAiOjE3NTQzMDgwMTZ9.kwByg82hBxxvjzFALPi9SR6cU1YsGAZWMXwFNtLtp6M; Max-Age=604800; Path=/; Expires=Mon, 04 Aug 2025 11:46:56 GMT; HttpOnly; SameSite=Lax",
];

console.log({
  accessToken: cookies[0].split(";")[0].split("=")[1],
  refreshToken: cookies[1].split(";")[0].split("=")[1],
});
