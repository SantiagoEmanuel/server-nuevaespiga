import { MercadoPagoConfig, Preference } from "mercadopago";

// Import dotenv
import dotenv from "dotenv";
dotenv.config();

// MercadoPago configuration
export const client = await new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// Create preference
export const preference = await new Preference(client);
