export async function handler(event) {
  // For coursework, notification is represented by CloudWatch logs.
  console.log("Notification: PaymentSucceeded", JSON.stringify(event.detail || {}));
}
