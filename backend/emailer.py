import resend
import os

resend.api_key = os.getenv("RESEND_API_KEY")

def send_summary_email1(to, content):
    resend.Emails.send({
        "from":"Acme <onboarding@resend.dev>",
        "to": to,
        "subject": "Your Expense Summary",
        "html": f"<pre>{content}</pre>"
    })
def send_mail(to, content):
    params: resend.Emails.SendParams = {
        "from":"Acme <onboarding@resend.dev>",
        "to":to,
        "subject": "Expenses Verify",
        "html": f"<strong>{content}!</strong>",
    }
    email: resend.Emails.SendResponse = resend.Emails.send(params)

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_summary_email(to_email, html_content):
    msg = MIMEMultipart()
    msg["From"] = os.getenv("SENDER_EMAIL")
    msg["To"] = to_email
    msg["Subject"] = "Your Expense Summary"

    msg.attach(MIMEText(html_content, "html"))

    with smtplib.SMTP(os.getenv("BREVO_SMTP_HOST"), int(os.getenv("BREVO_SMTP_PORT"))) as server:
        server.starttls()
        server.login(
            os.getenv("BREVO_SMTP_USER"),
            os.getenv("BREVO_SMTP_PASS")
        )
        server.send_message(msg)
