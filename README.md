# Smart Parts Backend (Microservices) — Serverless Framework + Cognito + DynamoDB

This project deploys multiple AWS Lambda microservices behind API Gateway (HTTP API), secured by a Cognito JWT authorizer.
It also creates DynamoDB tables and EventBridge event rules.

## 1) Prerequisites (Windows)
- Node.js LTS
- AWS CLI configured: `aws configure`
- Serverless Framework: `npm i -g serverless`

## 2) Set Cognito authorizer env vars (IMPORTANT)
Create a file `.env` (or set env vars in your shell) with:

COGNITO_ISSUER_URL=https://cognito-idp.us-east-1.amazonaws.com/<YOUR_USER_POOL_ID>
COGNITO_AUDIENCE=<YOUR_USER_POOL_APP_CLIENT_ID>

Example:
COGNITO_ISSUER_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AbCdEf
COGNITO_AUDIENCE=1h2j3k4l5m6n7o8p9q

## 3) Deploy
In PowerShell:
npm install
npx serverless deploy --stage dev --region us-east-1

## 4) Endpoints (high level)
Public:
- GET /parts
- GET /parts/{id}
- GET /inventory/{sku}

Protected (Cognito JWT):
- GET /me
- GET /cart
- POST /cart/items
- DELETE /cart/items/{sku}
- DELETE /cart
- POST /orders
- GET /orders
- GET /orders/{id}
- POST /payments/pay

Admin (Cognito group 'admin'):
- POST /admin/parts
- PUT /admin/parts/{id}
- DELETE /admin/parts/{id}

## 5) Events (EventBridge)
- Order service publishes `OrderCreated` (source: smartparts.orders)
- Inventory service consumes it to reserve stock
- Payment service publishes `PaymentSucceeded` (source: smartparts.payments)
- Order service consumes it to set order status PAID
- Notification service consumes it (logs to CloudWatch)

## 6) Seeding (required)
Create inventory items for SKUs you sell:
Table: smart-parts-backend-dev-inventory
Item:
{ "sku": "ABC-123", "qtyOnHand": 10, "qtyReserved": 0 }
"# smart-parts-server" 
