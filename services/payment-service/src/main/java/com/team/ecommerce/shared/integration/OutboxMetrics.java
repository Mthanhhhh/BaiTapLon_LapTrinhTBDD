package com.team.ecommerce.shared.integration;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/** Two indexed local-DB queries every 30 seconds; no request/user/order identifiers as labels. */
@Component
public class OutboxMetrics {
    private final JdbcTemplate db;
    private final AtomicReference<Double> projectionPending = new AtomicReference<>(Double.NaN);
    private final AtomicReference<Double> projectionAge = new AtomicReference<>(Double.NaN);
    private final AtomicReference<Double> commandPending = new AtomicReference<>(Double.NaN);
    private final AtomicReference<Double> commandAge = new AtomicReference<>(Double.NaN);
    private final AtomicReference<Double> collectionUp = new AtomicReference<>(0.0);
    public OutboxMetrics(JdbcTemplate db, MeterRegistry registry) {
        this.db = db;
        Gauge.builder("eshop.outbox.pending", projectionPending, AtomicReference::get).tag("kind", "projection").register(registry);
        Gauge.builder("eshop.outbox.pending", commandPending, AtomicReference::get).tag("kind", "command").register(registry);
        Gauge.builder("eshop.outbox.oldest.seconds", projectionAge, AtomicReference::get).tag("kind", "projection").register(registry);
        Gauge.builder("eshop.outbox.oldest.seconds", commandAge, AtomicReference::get).tag("kind", "command").register(registry);
        Gauge.builder("eshop.outbox.collection.up", collectionUp, AtomicReference::get).register(registry);
    }
    @Scheduled(fixedDelay = 30000, initialDelay = 10000)
    public void collect() {
        try {
            sample("service_outbox", projectionPending, projectionAge);
            sample("domain_outbox", commandPending, commandAge);
            collectionUp.set(1.0);
        } catch (org.springframework.dao.DataAccessException unavailable) {
            collectionUp.set(0.0);
            projectionPending.set(Double.NaN); projectionAge.set(Double.NaN);
            commandPending.set(Double.NaN); commandAge.set(Double.NaN);
        }
    }
    private void sample(String table, AtomicReference<Double> pending, AtomicReference<Double> age) {
        // table is an internal constant, never client input.
        Map<String,Object> row = db.queryForMap("SELECT COUNT(*) AS pending, COALESCE(TIMESTAMPDIFF(SECOND,MIN(created_at),UTC_TIMESTAMP()),0) AS age FROM " + table + " WHERE published_at IS NULL");
        pending.set(((Number) row.get("pending")).doubleValue());
        age.set(Math.max(0.0, ((Number) row.get("age")).doubleValue()));
    }
}
