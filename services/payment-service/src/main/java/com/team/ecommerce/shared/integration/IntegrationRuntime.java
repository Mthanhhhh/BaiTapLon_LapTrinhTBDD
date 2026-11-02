package com.team.ecommerce.shared.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.boot.actuate.health.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Component
public class IntegrationRuntime implements HealthIndicator {
 private final IntegrationContract contract;private final IntegrationClient client;private final ProjectionStore store;private final JdbcTemplate db;private final KafkaTemplate<String,Object> kafka;private final ObjectMapper json;
 private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(IntegrationRuntime.class);
 private volatile boolean ready=false;
 public IntegrationRuntime(IntegrationContract contract,IntegrationClient client,ProjectionStore store,JdbcTemplate db,KafkaTemplate<String,Object> kafka,ObjectMapper json){this.contract=contract;this.client=client;this.store=store;this.db=db;this.kafka=kafka;this.json=json;}
 @Scheduled(fixedDelay=5000,initialDelay=1000) public void bootstrap(){if(ready)return;try{
  for(var entry:contract.definition.imports().entrySet()){
   if(db.queryForObject("SELECT COUNT(*) FROM integration_bootstrap WHERE source_key=?",Long.class,entry.getKey())>0)continue;
   String[] name=entry.getKey().split("[.]",2);int offset=0;
   while(true){var page=client.get(name[0],"/internal/integration/snapshot/"+name[1]+"?offset="+offset);long version=((Number)page.get("version")).longValue();var rows=(List<Map<String,Object>>)page.get("rows");store.applyBatch(name[0],name[1],version,rows);if(rows.size()<500)break;offset+=500;}
   db.update("INSERT IGNORE INTO integration_bootstrap(source_key) VALUES(?)",entry.getKey());
  }ready=true;
 }catch(Exception error){log.warn("Owner snapshot not ready: {}",error.toString());}}
 @Scheduled(fixedDelay=500,initialDelay=2000) public void publish(){
  for(var event:db.queryForList("SELECT id,table_name,aggregate_key,deleted FROM service_outbox WHERE published_at IS NULL AND (claimed_until IS NULL OR claimed_until<UTC_TIMESTAMP(3)) ORDER BY id LIMIT 50")){
   long id=((Number)event.get("id")).longValue();
   if(db.update("UPDATE service_outbox SET claimed_until=DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 20 SECOND) WHERE id=? AND published_at IS NULL AND (claimed_until IS NULL OR claimed_until<UTC_TIMESTAMP(3))",id)!=1)continue;
   try{String table=event.get("table_name").toString(),key=event.get("aggregate_key").toString();var spec=contract.exported(table);boolean deleted=Boolean.TRUE.equals(event.get("deleted"))||event.get("deleted") instanceof Number n&&n.intValue()!=0;
    Map<String,Object> row=Map.of();if(!deleted){String[] keys=key.split(":",-1);String predicate=spec.keys().stream().map(k->(spec.query()!=null?"o.":"")+"`"+k+"`=?").collect(java.util.stream.Collectors.joining(" AND "));var rows=db.queryForList(contract.select(table)+" WHERE "+predicate,(Object[])keys);if(rows.isEmpty())deleted=true;else row=rows.get(0);}
    row=new LinkedHashMap<>(row);row.replaceAll((column,value)->value instanceof java.time.temporal.TemporalAccessor?value.toString():value);
    Map<String,Object> payload=new LinkedHashMap<>();payload.put("source",contract.definition.source());payload.put("table",table);payload.put("key",key);payload.put("version",id);payload.put("deleted",deleted);payload.put("row",row);
    kafka.send("integration-v1",contract.definition.source()+":"+table+":"+key,payload).get(5,TimeUnit.SECONDS);db.update("UPDATE service_outbox SET published_at=UTC_TIMESTAMP(3),claimed_until=NULL WHERE id=?",id);
   }catch(Exception ignored){/* Lease expires; record is retained for at-least-once delivery. */}
  }
 }
 @KafkaListener(topics="integration-v1",groupId="${spring.application.name}-projections") public void consume(Map<String,Object> event){store.apply(event.get("source").toString(),event.get("table").toString(),event.get("key").toString(),((Number)event.get("version")).longValue(),(Map<String,Object>)event.get("row"),Boolean.TRUE.equals(event.get("deleted")));}
 @Override public Health health(){return ready?Health.up().build():Health.down().withDetail("projection","bootstrapping owner snapshots").build();}
}
