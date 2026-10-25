package com.team.ecommerce.shared;

import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dev")
public class DbCheckController {

    private final JdbcTemplate jdbc;

    public DbCheckController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/db-check")
    public Map<String, Object> check() {
        return Map.of(
            "users",    jdbc.queryForObject("SELECT COUNT(*) FROM auth_db.users", Long.class),
            "products", jdbc.queryForObject("SELECT COUNT(*) FROM product_db.products", Long.class),
            "orders",   jdbc.queryForObject("SELECT COUNT(*) FROM order_db.orders", Long.class),
            "payments", jdbc.queryForObject("SELECT COUNT(*) FROM payment_db.payments", Long.class)
        );
    }
}