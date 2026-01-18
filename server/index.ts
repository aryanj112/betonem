/**
 * Server Entry Point
 */

import app from "./app";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 BetOnEm Backend Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`💳 PayPal Base URL: ${process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com"}`);
});
