import { Router } from "express";
import { db } from "../api/database.js";
import { preference } from "../api/mercadopago.js";

export const orders = Router();

orders.post("/create", async (req, res) => {
  const { orderInfo, orderProducts, preferenceId } = req.body;
  const orderData = {
    ...orderInfo,
    products: orderProducts,
    preferenceId: preferenceId || null,
  };

  const products = orderData.products;

  products.map((product) => {
    db.execute({
      sql: "update products set stock = stock - ? where id = ?",
      args: [product.quantity, product.id],
    });
  });

  db.execute({
    sql: "insert into orders (id, products, total, userId, userInfo, withdrawnOn, paymentMethod, paid, orderWithdrawn, preferenceId ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [
      orderData.id,
      JSON.stringify(orderData.products),
      orderData.total,
      orderData.userId,
      JSON.stringify(orderData.userInfo),
      orderData.withdrawnOn,
      orderData.paymentMethod,
      orderData.paid,
      orderData.orderWithdrawn,
      orderData.preferenceId,
    ],
  })
    .then((result) => {
      if (result.rowsAffected > 0) {
        return res.status(201).send({
          message: "Order created successfully",
        });
      }
    })
    .catch((error) => {
      return res.status(500).json({
        message: "Error creating order",
        error: error,
      });
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
            "https://nearly-touched-mosquito.ngrok-free.app/admin/orders/update/paymentStatus/success",
          failure:
            "https://nearly-touched-mosquito.ngrok-free.app/admin/orders/update/paymentStatus/failure",
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

orders.get("/getUserOrders/:userId", async (req, res) => {
  const { userId } = req.params;

  const { rows: orders } = await db.execute({
    sql: "select * from  orders where userId = ?",
    args: [userId],
  });

  return res.send(orders);
});
