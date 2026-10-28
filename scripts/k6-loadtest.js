import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '3s', target: 20 },  // Ramp-up to 20 virtual users
    { duration: '8s', target: 50 },  // Sustained load at 50 users
    { duration: '3s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% requests under 100ms
    http_req_failed: ['rate<0.01'],   // Error rate below 1%
  },
};

export default function () {
  const host = __ENV.TARGET_HOST || 'host.docker.internal:8080';

  // Test 1: Fetch Categories (Cached in Redis)
  const catRes = http.get(`http://${host}/api/v1/categories`);
  check(catRes, {
    'categories status 200': (r) => r.status === 200,
  });

  // Test 2: Fetch Product Detail (Cached in Redis)
  const prodRes = http.get(`http://${host}/api/v1/products/10`);
  check(prodRes, {
    'product status 200': (r) => r.status === 200,
  });

  sleep(0.05);
}

