import nodemailer, { Transporter } from 'nodemailer';
import "dotenv/config";

class MailService {
  private transporter: Transporter;
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendActivationLink(to: string, link: string) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: to,
      subject: 'Account activation on ChartAlchemy',
      text: '',
      html: `
          <div>
            <h1>Click the link below to activate your account</h1>
              <h3>
                <a href="${link}">Activate account</a>
              </h3>
          </div>
        `,
    });
  }
  
  async sendPasswordResetLink(to: string, link: string) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: to,
      subject: 'Password reset on ChartAlchemy',
      text: '',
      html: `
          <div>
            <h1>Click the link below to reset your password</h1>
              <h3>
                <a href="${link}">Reset password</a>
              </h3>
          </div>
        `,
    });
  }
}

export default new MailService();
