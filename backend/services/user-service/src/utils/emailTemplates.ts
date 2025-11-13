export const generateOtpEmailTemplate = (otp: string, username: string) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mucchatlu OTP Verification</title>
    <style>
      /* General Reset */
      body {
        font-family: 'Poppins', Arial, sans-serif;
        background: linear-gradient(135deg, #E9EEF6, #F8FAFD);
        margin: 0;
        padding: 0;
      }

      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .header {
        background-color: #F9AB00;
        color: #fff;
        text-align: center;
        padding: 30px 20px;
      }

      .header h1 {
        font-size: 28px;
        margin: 0;
        letter-spacing: 1px;
      }

      .body {
        text-align: center;
        padding: 40px 20px;
        background-color: #F8FAFD; /* ✅ fixed: removed stray semicolon and quote */
      }

      .body h2 {
        color: #111827;
        font-size: 22px;
        margin-bottom: 10px;
      }

      .otp {
        display: inline-block;
        font-size: 3.5rem;
        letter-spacing: 10px;
        font-weight: 700;
        color: #F9AB00;
        background: #eef2ff;
        border-radius: 16px;
        padding: 20px 40px;
        margin: 30px 0;
        text-decoration: underline;
      }

      .footer {
        background-color: #f9fafb;
        color: #6b7280;
        text-align: center;
        padding: 20px;
        font-size: 14px;
      }

      .footer span {
        color: #F9AB00;
        font-weight: 600;
      }

      @media (max-width: 600px) {
        .otp {
          font-size: 2.5rem;
          padding: 15px 30px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Mucchatlu Verification</h1>
      </div>
      <div class="body">
        <h2>Hello ${username || "User"} 👋</h2>
        <p>Here’s your <strong>One-Time Password (OTP)</strong> for secure login:</p>
        <div class="otp">${otp}</div>
        <p>This code is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
      </div>
      <div class="footer">
        <p>Made with 💙 by <span>Mucchatlu</span> Team</p>
      </div>
    </div>
  </body>
  </html>
  `;
};
