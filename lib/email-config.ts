import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY)


export const sendEmail = async (html:string, to: string, subject: string) => {
    const { data, error } = await resend.emails.send({
      from: 'GatorBudz <onboarding@resend.dev>',
      to,
      subject,
      html,
    })
} 