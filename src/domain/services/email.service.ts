export interface ISendEmailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface IEmailService {
  sendEmail(input: ISendEmailInput): Promise<void>;
}
