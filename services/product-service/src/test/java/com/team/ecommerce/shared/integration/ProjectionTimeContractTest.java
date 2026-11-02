package com.team.ecommerce.shared.integration;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
class ProjectionTimeContractTest {
 @Test void acceptsKafkaLocalDateTimeArrayWithoutJavaSerialization(){assertEquals(java.sql.Timestamp.valueOf("2026-11-02 12:34:56.123"),ProjectionStore.convert(List.of(2026,11,2,12,34,56,123000000),"datetime(3)"));}
 @Test void acceptsHttpIsoTimestampAndNull(){assertEquals("2026-11-02 12:34:56.123",ProjectionStore.convert("2026-11-02T12:34:56.123Z","timestamp(3)"));assertNull(ProjectionStore.convert(null,"datetime"));}
 @Test void preservesDateAndNonTemporalValues(){assertEquals(java.sql.Date.valueOf("2026-11-02"),ProjectionStore.convert(List.of(2026,11,2),"date"));assertEquals(42,ProjectionStore.convert(42,"bigint"));}
}
