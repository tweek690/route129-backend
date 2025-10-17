/**
 * Route129 Smokehouse - Backend API (Express)
 *
 * TODO: This is a scaffold. You'll need to set Toast API credentials via environment variables
 * in Render (instructions will be provided). There are clear TODO markers where Toast info is required.
 *
 * Endpoints:
 *  GET /health
 *  GET /menu
 *  POST /cart -> validate cart (optional)
 *  POST /order -> create order in Toast (placeholder) and return confirmation
 *  POST /webhook/toast -> receive Toast webhook events (placeholder)
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Config - set these as environment variables in Render
const PORT = process.env.PORT || 3000;
const RESTAURANT_NAME = process.env.RESTAURANT_NAME || "Route 129 Smokehouse";

/**
 * TODO: Add Toast API credentials to environment variables in Render
 * - TOAST_API_BASE  (e.g. https://api.toasttab.com or the partner/sandbox URL)
 * - TOAST_CLIENT_ID
 * - TOAST_CLIENT_SECRET
 * - TOAST_RESTAURANT_GUID
 *
 * For now the code uses mock flow until credentials are provided.
 */
const TOAST_API_BASE = process.env.TOAST_API_BASE || ""; // TODO: set in Render
const TOAST_CLIENT_ID = process.env.TOAST_CLIENT_ID || ""; // TODO: set in Render
const TOAST_CLIENT_SECRET = process.env.TOAST_CLIENT_SECRET || ""; // TODO: set in Render
const TOAST_RESTAURANT_GUID = process.env.TOAST_RESTAURANT_GUID || ""; // TODO: set in Render

// For demonstration: a small mock menu derived from the photos you provided.
// When Toast API is available, we'll replace this by fetching live menu items.
const MOCK_MENU = {
  restaurant: RESTAURANT_NAME,
  categories: [
    {
      id: "platters",
      name: "Platters",
      items: [
        { id: "2_combo_platter", name: "Pick 2 Combo Platter", price: 19.95, description: "Select two meats, includes 2 sides" },
        { id: "3_trio_platter", name: "Pick 3 Trio Platter", price: 23.95, description: "Select three meats, includes 2 sides" }
      ]
    },
    {
      id: "sides",
      name: "Sides",
      items: [
        { id: "mac_and_cheese", name: "Macaroni & Cheese", price: 3.89 },
        { id: "potato_salad", name: "Potato Salad", price: 3.89 },
        { id: "french_fries", name: "French Fries", price: 3.89 }
      ]
    },
    {
      id: "handhelds",
      name: "Handhelds",
      items: [
        { id: "smoked_bologna_on_toast", name: "Smoked Bologna on Texas Toast", price: 10.99 },
        { id: "pulled_pork_sandwich", name: "Pulled Pork Sandwich", price: 10.99 }
      ]
    }
  ]
};

// ========================
// Utility: Toast API helpers (placeholder)
// ========================
async function getToastAccessToken() {
  // TODO: Implement real OAuth/token exchange with Toast when credentials are available.
  // For now, return null to indicate mock mode.
  if (!TOAST_CLIENT_ID || !TOAST_CLIENT_SECRET || !TOAST_API_BASE) {
    return null;
  }

  // Example pseudocode for token fetch:
  // const resp = await axios.post(`${TOAST_API_BASE}/oauth/token`, { client_id: TOAST_CLIENT_ID, client_secret: TOAST_CLIENT_SECRET, grant_type: "client_credentials" });
  // return resp.data.access_token;
  return null;
}

// ========================
// Routes
// ========================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'route129-backend', ts: new Date().toISOString() });
});

// Menu endpoint - returns mock menu now, later will fetch from Toast
app.get('/menu', async (req, res) => {
  // If Toast credentials provided, you could call Toast menu API here.
  // TODO: Replace mock with call to Toast menu endpoints once credentials are set.
  res.json(MOCK_MENU);
});

// Optional: quick cart validation
app.post('/cart', (req, res) => {
  const cart = req.body;
  // Basic validation
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return res.status(400).json({ error: 'Cart empty or invalid' });
  }
  // In production we'd check item IDs/prices against Toast
  res.json({ ok: true, validatedAt: new Date().toISOString() });
});

// Order endpoint - receives order from Bolt UI and submits to Toast (or mocks it until Toast credentials are provided)
app.post('/order', async (req, res) => {
  /**
   * Expected body from Bolt:
   * {
   *   customer: { name: "Jane", phone: "555-1234" },   // optional
   *   items: [ { id: "pulled_pork_sandwich", qty: 1, modifiers: [] }, ... ],
   *   notes: "No onions",
   *   pickupTime: "2025-10-20T18:30:00-05:00"
   * }
   */
  const order = req.body || {};
  if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
    return res.status(400).json({ error: 'Order must include items' });
  }

  // Generate internal order id
  const internalOrderId = `r129-${uuidv4()}`;

  // If Toast credentials missing -> return a mocked confirmation response
  const token = await getToastAccessToken();
  if (!token) {
    // MOCK MODE - return a simulated Toast confirmation
    const mockConfirmation = {
      status: 'received',
      internalOrderId,
      toastOrderId: null,
      message: 'Mock order accepted. Replace with Toast API credentials to send to POS.',
      estimatedPickupMinutes: 20
    };
    return res.json({ success: true, confirmation: mockConfirmation });
  }

  // REAL MODE (placeholder) - when token present, submit to Toast API
  try {
    // Example shape — adapt to Toast API requirements
    const payload = {
      restaurant_guid: TOAST_RESTAURANT_GUID,
      items: order.items,
      notes: order.notes || '',
      customer: order.customer || {},
      pickup_time: order.pickupTime || null
    };

    const resp = await axios.post(`${TOAST_API_BASE}/orders`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // resp.data should have actual Toast data; adapt extraction as needed
    const toastOrder = resp.data;
    res.json({
      success: true,
      confirmation: {
        status: 'sent_to_toast',
        internalOrderId,
        toastOrderId: toastOrder.id || toastOrder.orderGuid || null,
        message: 'Order sent to Toast POS'
      }
    });
  } catch (err) {
    console.error('Error sending order to Toast:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to send order to Toast', details: err?.response?.data || err.message });
  }
});

// Webhook endpoint for Toast updates
app.post('/webhook/toast', (req, res) => {
  /**
   * Toast will POST order status updates here.
   * TODO: Ensure the webhook URL is configured in Toast admin and that this endpoint is reachable by Toast.
   *
   * Example process:
   * - Validate webhook signature (if Toast provides one)
   * - Update internal order status in DB (not implemented here)
   * - Optionally notify Bolt via webhook or let Bolt poll /order-status endpoint
   */
  console.log('Received Toast webhook:', JSON.stringify(req.body).slice(0, 1000));
  // Respond 200 quickly
  res.json({ received: true });
});

// ✅ Simple test route so Render shows a response
app.get("/test", (req, res) => {
  res.json({ message: "Route 129 backend is running ✅" });
});

// Fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`${RESTAURANT_NAME} backend listening on port ${PORT}`);
});
