import { sendMail } from "../utils/mail";

export async function sendUserPasswordEmail(
    userEmail: string,
    username: string,
    password: string
) {
    const text = `
Hi ${username},

Your account has been created. You can now log in using this password:

Password: ${password}

Please change it after logging in.

Best regards,
Multiquote-app Team
`;

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif;">
  <div style="max-width: 600px; margin: auto; padding: 20px;">
    <h3>Hi ${username},</h3>
    <p>Your account has been created. You can now log in with the password below:</p>
    <p style="font-size: 20px; font-weight: bold;">${password}</p>
    <br/>
    <p>Best regards,<br/>Multiquote-app Team</p>
  </div>
</body>
</html>
`;

    await sendMail(userEmail, 'Your Account Password', text, html);
}


export const sendVerificationCodeEmail = async (
    email: string,
    fullName: string,
    code: string
) => {
    const text = `
  Hi ${fullName},
  
  Your verification code is:
  
  ${code}
  
  This code will expire in 10 minutes.
  
  Best,
  Your Multiquote-app Team
  `;

    const html = `
  <!DOCTYPE html>
  <html>
  <body style="font-family: sans-serif;">
    <p>Hi ${fullName},</p>
    <p>Your verification code is:</p>
    <h2>${code}</h2>
    <p>This code will expire in 10 minutes.</p>
    <p>Best regards,<br/>Your Multiquote-app Team</p>
  </body>
  </html>
  `;

    await sendMail(email, "Your Verification Code", text, html);
};
