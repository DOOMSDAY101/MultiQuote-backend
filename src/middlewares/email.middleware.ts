import { sendMail } from "../utils/mail";

export async function sendUserPasswordEmail(
  userEmail: string,
  username: string,
  password: string,
  type: 'create' | 'update' = 'create' // default to create
) {
  const isCreated = type === 'create';

  const subject = isCreated ? 'Your Account Password' : 'Your Password Has Been Updated';
  const actionText = isCreated
    ? 'Your account has been created. You can now log in using this password:'
    : 'Your password has been updated. You can now log in using the new password:';

  const text = `
Hi ${username},

${actionText}

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
    <p>${actionText}</p>
    <p style="font-size: 20px; font-weight: bold;">${password}</p>
    <br/>
    <p>Best regards,<br/>Multiquote-app Team</p>
  </div>
</body>
</html>
`;

  await sendMail(userEmail, subject, text, html);
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
