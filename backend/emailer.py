import resend
import os

resend.api_key = os.getenv("RESEND_API_KEY")

def send_summary_email(to, content):
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