package com.team.ecommerce.shared.integration;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataAccessResourceFailureException;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class OutboxMetricsTest {
    @Test void recordsBacklogAndOldestAgeFromOwnedDatabase() {
        var db = mock(JdbcTemplate.class);
        when(db.queryForMap(anyString())).thenReturn(Map.of("pending", 3L, "age", 45L));
        var registry = new SimpleMeterRegistry();
        new OutboxMetrics(db, registry).collect();
        assertEquals(3.0, registry.get("eshop.outbox.pending").tag("kind", "command").gauge().value());
        assertEquals(45.0, registry.get("eshop.outbox.oldest.seconds").tag("kind", "projection").gauge().value());
        assertEquals(1.0, registry.get("eshop.outbox.collection.up").gauge().value());
    }
    @Test void failedCollectionCannotLookLikeAnEmptyHealthyQueue() {
        var db = mock(JdbcTemplate.class);
        when(db.queryForMap(anyString())).thenThrow(new DataAccessResourceFailureException("test database unavailable"));
        var registry = new SimpleMeterRegistry();
        new OutboxMetrics(db, registry).collect();
        assertEquals(0.0, registry.get("eshop.outbox.collection.up").gauge().value());
        assertTrue(Double.isNaN(registry.get("eshop.outbox.pending").tag("kind", "command").gauge().value()));
    }
}
