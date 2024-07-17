import { Router } from "express";
import { db } from "../api/database.js";
import { preference } from "../api/mercadopago.js";

export const orders = Router();

orders.post("/create", async (req, res) => {
  const data = req.body;
  const orderData = {
    ...data.orderInfo,
    products: data.orderProducts,
    preferenceId: data.preferenceId || null,
  };
  orderData.userInfo = JSON.stringify(orderData.userInfo);
  orderData.products = JSON.stringify(orderData.products);
  console.log(orderData);
  db.execute({
    sql: "insert into orders (id, products, total, userId, userInfo, toWithdrawnOn, paymentMethod, isPaid, orderWithdrawn, preferenceId ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [
      orderData.id,
      orderData.products,
      orderData.total,
      orderData.userId,
      orderData.userInfo,
      orderData.toWithdrawnOn,
      orderData.paymentMethod,
      orderData.isPaid,
      orderData.orderWithdrawn,
      orderData.preferenceId,
    ],
  })
    .then((result) => {
      console.log(result);
    })
    .catch((error) => {
      console.log(error);
    });

  res.status(201).json({
    message: "Order created successfully",
  });
});

orders.post("/create/preference", async (req, res) => {
  const data = req.body;
  const items = [];
  data.items.map((item) => {
    items.push({
      id: item.id,
      title: item.title,
      picture_url: item.image,
      quantity: item.quantity,
      unit_price: item.price,
    });
  });
  const newPreference = await preference
    .create({
      body: {
        items: items,
        payer: {
          email: data.payer.email,
          name: data.payer.fullName,
        },
        back_urls: {
          success:
            "https://defend-nigeria-cord-saint.trycloudflare.com/orders/update/paymentStatus/success",
          failure:
            "https://defend-nigeria-cord-saint.trycloudflare.com/orders/update/paymentStatus/success",
          pending:
            "https://defend-nigeria-cord-saint.trycloudflare.com/orders/update/paymentStatus/success",
        },
        binary_mode: true,
        auto_return: "approved",
        statement_descriptor: "La Nueva Espiga",
      },
    })
    .then((response) => {
      return {
        message: "Preference created successfully",
        preferenceId: response.id,
        sandboxUrl: response.sandbox_init_point,
      };
    })
    .catch((error) => {
      return {
        message: "Error creating preference",
        error: error.message,
        allError: error,
      };
    });

  return res.send(newPreference);
});

orders.post("/update/paymentStatus/success", (req, res) => {
  console.log(req.params, req.body, req.query, req.headers);
  db.execute({
    sql: "update orders set isPaid = ? where preferenceId = ?",
    args: [true, data.preferenceId],
  });
  res.status(200).redirect("http://localhost:5173/");
});
