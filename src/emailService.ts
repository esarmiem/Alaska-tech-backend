import nodemailer from 'nodemailer';

interface EmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendEmail(data: EmailData): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECIPIENT_EMAIL,
    subject: `Nuevo mensaje de ${data.name}: ${data.subject}`,
    text: `
      Nombre: ${data.name}
      Email: ${data.email}
      Asunto: ${data.subject}
      Mensaje: ${data.message}
    `
  };

  await transporter.sendMail(mailOptions);
}