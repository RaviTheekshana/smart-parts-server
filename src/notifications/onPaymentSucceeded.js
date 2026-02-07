// export async function handler(event) {
//   // For coursework, notification is represented by CloudWatch logs.
//   console.log("Notification: PaymentSucceeded", JSON.stringify(event.detail || {}));
// }

import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({ region: "us-east-1" });

export async function handler(event) {
  console.log("Notification: PaymentSucceeded", JSON.stringify(event.detail || {}));

  try {
    const snsParams = {
      TopicArn: "arn:aws:sns:us-east-1:375353319115:SmartPartPaymentNotification",
      Message: JSON.stringify(event.detail || event, null, 2),
      Subject: "Payment Succeeded Notification"
    };

    const command = new PublishCommand(snsParams);
    const response = await snsClient.send(command);

    console.log("SNS publish success:", response.MessageId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Notification sent successfully",
        messageId: response.MessageId
      })
    };

  } catch (error) {
    console.error("Error publishing to SNS:", error);
    throw error;
  }
}