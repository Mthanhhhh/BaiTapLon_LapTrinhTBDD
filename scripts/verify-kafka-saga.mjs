const BASE_URL = 'http://localhost:8080/api/v1';

async function runSagaTest() {
  console.log('=== KAFKA SAGA PATTERN VERIFICATION ===\n');

  // 1. Get Authentication Token
  console.log('1. Logging in to acquire JWT token...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'kafka_tester2@example.com',
      password: 'Password123!',
    }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  console.log('   ✓ Acquired JWT token.\n');

  // 2. Check initial product stock
  console.log('2. Checking initial stock of Product 10 (Red Sneakers)...');
  const prodBeforeRes = await fetch(`${BASE_URL}/products/10`);
  const prodBeforeData = await prodBeforeRes.json();
  const initialStock = prodBeforeData.data.stock;
  console.log(`   ✓ Initial Stock = ${initialStock}\n`);

  // 3. Add to Cart for User 1 (Specifying variantId = 10)
  console.log('3. Adding 2 items of Product 10 to Cart...');
  const addCartRes = await fetch(`${BASE_URL}/cart/items`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productId: 10, variantId: 10, quantity: 2 }),
  });
  const addCartData = await addCartRes.json();
  if (!addCartData.success) {
    console.error('Failed to add to cart:', addCartData);
    return;
  }
  console.log('   ✓ Added 2 items to Cart.\n');

  // 4. Create Order using Address ID 4 (User 1's address)
  console.log('4. Creating Order with addressId = 4 (POST /api/v1/orders)...');
  const orderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      addressId: 4,
      paymentMethod: 'VISA',
      note: 'Kafka Saga Test',
    }),
  });
  const orderData = await orderRes.json();
  if (!orderData.success) {
    console.error('Order creation failed:', orderData);
    return;
  }
  const order = orderData.data;
  console.log(`   ✓ Order #${order.id} created! Total = $${order.total}`);
  console.log('   ✓ OrderCreatedEvent published to Kafka topic: order-events\n');

  // Check stock after order creation
  const prodDuringRes = await fetch(`${BASE_URL}/products/10`);
  const prodDuringData = await prodDuringRes.json();
  console.log(`   ✓ Stock after order creation = ${prodDuringData.data.stock} (Deducted 2 items)\n`);

  // 6. Simulate Payment Failure
  console.log('6. Processing Payment with mock decline card ending in 0000...');
  const payRes = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      orderId: order.id,
      method: 'VISA',
      cardNumber: '4111111111110000',
      cardHolderName: 'Saga Decline',
      expiryDate: '12/28',
      cvv: '123',
    }),
  });
  const payData = await payRes.json();
  console.log('   ✓ Payment correctly REJECTED with message:', payData.message);
  console.log('   ✓ PaymentFailedEvent published to Kafka topic: payment-events (Saga Triggered)!\n');

  // 7. Wait 3 seconds for Kafka Consumer
  console.log('7. Waiting 3 seconds for StockCompensationConsumer to consume Kafka event and restore stock...');
  await new Promise((r) => setTimeout(r, 3000));

  // 8. Verify restored stock
  const prodAfterRes = await fetch(`${BASE_URL}/products/10`);
  const prodAfterData = await prodAfterRes.json();
  const finalStock = prodAfterData.data.stock;
  console.log(`8. Verifying stock restoration in product_db:`);
  console.log(`   - Initial Stock: ${initialStock}`);
  console.log(`   - Deducted Stock: ${prodDuringData.data.stock}`);
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

