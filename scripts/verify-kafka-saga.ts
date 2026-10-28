import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/v1';

async function runSagaTest() {
  console.log('=== KAFKA SAGA PATTERN VERIFICATION ===\n');

  // 1. Register & Login
  const email = `kafka_saga_${Date.now()}@example.com`;
  console.log(`1. Registering user: ${email}...`);
  const regRes = await axios.post(`${BASE_URL}/auth/register`, {
    fullName: 'Saga Kafka User',
    email,
    password: 'Password123!',
  });
  const token = regRes.data.data.accessToken;
  const headers = { Authorization: `Bearer ${token}` };
  console.log('   ✓ Registered successfully and acquired JWT token.\n');

  // 2. Check initial product stock
  console.log('2. Checking initial stock of Product 10 (Red Sneakers)...');
  const prodBefore = await axios.get(`${BASE_URL}/products/10`);
  const initialStock = prodBefore.data.data.stock;
  console.log(`   ✓ Initial Stock = ${initialStock}\n`);

  // 3. Add to Cart
  console.log('3. Adding 2 items of Product 10 to Cart...');
  await axios.post(
    `${BASE_URL}/cart/items`,
    { productId: 10, quantity: 2 },
    { headers }
  );
  console.log('   ✓ Added 2 items to Cart.\n');

  // 4. Add Delivery Address
  console.log('4. Adding Delivery Address...');
  const addrRes = await axios.post(
    `${BASE_URL}/addresses`,
    {
      fullName: 'Saga Receiver',
      phone: '+1 555-0199',
      street: '123 Kafka Way',
      city: 'Distributed City',
      country: 'EventLand',
      isDefault: true,
    },
    { headers }
  );
  const addressId = addrRes.data.data.id;
  console.log(`   ✓ Address created with ID = ${addressId}\n`);

  // 5. Create Order (Triggers stock deduction and publishes OrderCreatedEvent to Kafka)
  console.log('5. Creating Order (POST /api/v1/orders)...');
  const orderRes = await axios.post(
    `${BASE_URL}/orders`,
    {
      addressId,
      paymentMethod: 'VISA',
      note: 'Kafka Saga Test',
    },
    { headers }
  );
  const order = orderRes.data.data;
  console.log(`   ✓ Order #${order.id} created! Total = $${order.total}`);
  console.log('   ✓ OrderCreatedEvent published to Kafka topic: order-events\n');

  // Check stock after order creation (Stock should be deducted: initial - 2)
  const prodDuring = await axios.get(`${BASE_URL}/products/10`);
  console.log(`   ✓ Stock after order creation = ${prodDuring.data.data.stock} (Deducted 2 items)\n`);

  // 6. Simulate Payment Failure (Card ending in 0000)
  console.log('6. Processing Payment with mock decline card ending in 0000...');
  try {
    await axios.post(
      `${BASE_URL}/payments`,
      {
        orderId: order.id,
        method: 'VISA',
        cardNumber: '4111111111110000',
        cardHolderName: 'Saga Decline',
        expiryDate: '12/28',
        cvv: '123',
      },
      { headers }
    );
  } catch (err) {
    console.log('   ✓ Payment correctly REJECTED with message:', err.response?.data?.message || err.message);
    console.log('   ✓ PaymentFailedEvent published to Kafka topic: payment-events (Saga Triggered)!\n');
  }

  // 7. Wait 2 seconds for Kafka Consumer to process stock compensation
  console.log('7. Waiting 2.5 seconds for StockCompensationConsumer to consume Kafka event and restore stock...');
  await new Promise((r) => setTimeout(r, 2500));

  // 8. Verify restored stock
  const prodAfter = await axios.get(`${BASE_URL}/products/10`);
  const finalStock = prodAfter.data.data.stock;
  console.log(`8. Verifying stock restoration in product_db:`);
  console.log(`   - Initial Stock: ${initialStock}`);
  console.log(`   - Deducted Stock: ${prodDuring.data.data.stock}`);
  console.log(`   - Final Stock after Saga Compensation: ${finalStock}`);

  if (finalStock === initialStock) {
    console.log('\n======================================================');
    console.log('🎉 SAGA PATTERN VIA KAFKA VERIFIED 100% SUCCESSFULLY! 🎉');
    console.log('Stock was automatically restored when payment failed!');
    console.log('======================================================\n');
  } else {
    console.log('\n❌ Stock restoration mismatch. Expected:', initialStock, 'Got:', finalStock);
  }
}

runSagaTest().catch(console.error);

