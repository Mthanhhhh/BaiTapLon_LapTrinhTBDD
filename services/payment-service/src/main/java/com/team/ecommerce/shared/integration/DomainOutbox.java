package com.team.ecommerce.shared.integration;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.*;
import java.util.concurrent.TimeUnit;
@Component @RequiredArgsConstructor
public class DomainOutbox {
 private final JdbcTemplate db;private final ObjectMapper json;private final KafkaTemplate<String,Object> kafka;private final IntegrationContract contract;private final org.springframework.beans.factory.ObjectProvider<DomainCommandHandler> handler;private final PlatformTransactionManager manager;
 public void enqueue(String target,String action,Map<String,?> input,String key){try{db.update("INSERT IGNORE INTO domain_outbox(command_key,target_name,action_name,payload,aggregate_key) VALUES(?,?,?,?,?)",key,target,action,json.writeValueAsString(input),target+":"+(input.containsKey("orderId")?input.get("orderId"):key));}catch(java.io.IOException e){throw new IllegalArgumentException(e);}}
 @Scheduled(fixedDelay=500,initialDelay=2000)public void publish(){for(var row:db.queryForList("SELECT o.* FROM domain_outbox o WHERE o.published_at IS NULL AND (o.claimed_until IS NULL OR o.claimed_until<UTC_TIMESTAMP(3)) AND NOT EXISTS (SELECT 1 FROM domain_outbox prior WHERE prior.aggregate_key=o.aggregate_key AND prior.id<o.id AND prior.published_at IS NULL) ORDER BY o.id LIMIT 50")){
  Object id=row.get("id");if(db.update("UPDATE domain_outbox SET claimed_until=DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 20 SECOND) WHERE id=? AND published_at IS NULL AND (claimed_until IS NULL OR claimed_until<UTC_TIMESTAMP(3))",id)!=1)continue;
  try{var event=Map.of("target",row.get("target_name"),"action",row.get("action_name"),"key",row.get("command_key"),"input",json.readValue(row.get("payload").toString(),Map.class));kafka.send("domain-commands-v1",row.get("aggregate_key").toString(),event).get(5,TimeUnit.SECONDS);db.update("UPDATE domain_outbox SET published_at=UTC_TIMESTAMP(3),claimed_until=NULL WHERE id=?",id);}catch(Exception ignored){}
 }}
 @KafkaListener(topics="domain-commands-v1",groupId="${spring.application.name}-commands")public void consume(Map<String,Object> event){if(!contract.definition.source().equals(event.get("target")))return;new TransactionTemplate(manager).executeWithoutResult(tx->{if(db.update("INSERT IGNORE INTO domain_inbox(command_key) VALUES(?)",event.get("key"))==0)return;handler.getObject().handle(event.get("action").toString(),(Map<String,Object>)event.get("input"));});}
}
