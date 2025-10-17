# Route 129 Smokehouse - Backend

This is a ready-to-deploy Express backend for Bolt.new front end. It exposes:
- GET /menu
- POST /cart
- POST /order
- POST /webhook/toast
- GET /health

## Important: Toast credentials
Before connecting to real Toast, set these environment variables:
- TOAST_API_BASE  (Toast base URL)
- TOAST_CLIENT_ID
- TOAST_CLIENT_SECRET
- TOAST_RESTAURANT_GUID
- RESTAURANT_NAME (optional, default Route 129 Smokehouse)

Without them, the server returns mocked responses so Bolt UI can be developed and tested.

## Deploy to Render
Follow the instructions provided by your assistant or in the Render dashboard.
