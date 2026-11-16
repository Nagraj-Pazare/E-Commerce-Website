import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import IORedis from 'ioredis';


const connection = new IORedis({
    host: 'redis',
    port: 6379,
    maxRetriesPerRequest: null,
})

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SENDER_PASS,
  },
});

const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    console.log("processing email job: ", job.id, job.data);

    const {
      orderId,
      email,
      receiverName,
      phoneNumber,
      shippingAddress,
      items,
      totalAmount,
      paymentStatus,
    } = job.data;

    // Format products into an HTML table rows
    const itemsHtml = items
      .map(
        (item) => `
     <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">
        <strong>${item.productName}</strong><br>
        <span style="font-size: 12px; color: #718096;">Product ID: ${item.productId}</span>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${Number(item.priceAtPurchase).toFixed(2)}</td>
    </tr>
  `,
      )
      .join("");

    // Construct the email body
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2b6cb0;">Order Confirmation</h2>
      <p>Thank you for your order! Your payment was successful.</p>
      
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Payment Status:</strong> <span style="color: green; font-weight: bold;">${paymentStatus}</span></p>

      <h3>Receiver Details</h3>
      <p><strong>Name:</strong> ${receiverName}</p>
      <p><strong>Phone Number:</strong> ${phoneNumber}</p>
      <p><strong>Shipping Address:</strong><br>
        ${shippingAddress.addressLine1}, ${shippingAddress.addressLine2 ? shippingAddress.addressLine2 + "," : ""} 
        ${shippingAddress.city}, ${shippingAddress.stateOrProvince} - ${shippingAddress.postalCode}, ${shippingAddress.country}
      </p>

      <h3>Ordered Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f7fafc;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <h3 style="text-align: right;">Total Amount: ₹${totalAmount.toFixed(2)}</h3>
    </div>
  `;

    const mailOptions = {
      form: process.env.SENDER_EMAIL,
      to: email,
      subject: `Order Confirmation #${orderId}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent successfully to ${email}`);
  },
  {
    connection
  },
);

emailWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed!`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email job ${job.id} failed:`, err);
});

emailWorker.on("error", (err) => {
  console.error("Worker connection error:", err);
});
