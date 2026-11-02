package com.team.ecommerce.shared.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import java.util.*;

@Component
public class ProjectionStore {
 private final IntegrationContract contract;private final JdbcTemplate db;private final TransactionTemplate tx;
 public ProjectionStore(IntegrationContract contract,JdbcTemplate db,PlatformTransactionManager manager){this.contract=contract;this.db=db;tx=new TransactionTemplate(manager);}
 public void applyBatch(String source,String table,long version,List<Map<String,Object>> rows){
  var definition=contract.definition.imports().get(source+"."+table);if(definition==null)return;
  var sorted=rows.stream().sorted(Comparator.comparing(row->definition.keys().stream().map(k->Objects.toString(row.get(k))).collect(java.util.stream.Collectors.joining(":")))).toList();
  tx.executeWithoutResult(status->{for(var row:sorted){String key=definition.keys().stream().map(k->Objects.toString(row.get(k))).collect(java.util.stream.Collectors.joining(":"));apply(source,table,key,version,row,false);}});
 }
 public void apply(String source,String table,String key,long version,Map<String,Object> row,boolean deleted){
  var definition=contract.definition.imports().get(source+"."+table);if(definition==null)return;
  tx.executeWithoutResult(status->{
   db.update("INSERT IGNORE INTO integration_applied(source_name,table_name,aggregate_key) VALUES(?,?,?)",source,table,key);
   long prior=db.queryForObject("SELECT last_version FROM integration_applied WHERE source_name=? AND table_name=? AND aggregate_key=? FOR UPDATE",Long.class,source,table,key);
   if(version<=prior)return;
   if(deleted){var keys=key.split(":",-1);if(keys.length!=definition.keys().size())throw new IllegalArgumentException("Invalid event key");db.update("DELETE FROM `"+definition.target()+"` WHERE "+definition.keys().stream().map(k->"`"+k+"`=?").collect(java.util.stream.Collectors.joining(" AND ")),(Object[])keys);}
   else{
    var columns=definition.columns();var values=columns.stream().map(c->convert(row.get(c.name()),c.type())).toArray();
    String names=columns.stream().map(c->"`"+c.name()+"`").collect(java.util.stream.Collectors.joining(","));
    String update=columns.stream().filter(c->!c.pk()).map(c->"`"+c.name()+"`=VALUES(`"+c.name()+"`)").collect(java.util.stream.Collectors.joining(","));
    if(update.isEmpty())update="`"+definition.keys().get(0)+"`=VALUES(`"+definition.keys().get(0)+"`)";
    db.update("INSERT INTO `"+definition.target()+"` ("+names+") VALUES ("+String.join(",",Collections.nCopies(columns.size(),"?"))+") ON DUPLICATE KEY UPDATE "+update,values);
   }
   db.update("UPDATE integration_applied SET last_version=? WHERE source_name=? AND table_name=? AND aggregate_key=?",version,source,table,key);
  });
 }
 static Object convert(Object value,String type){
  if(value==null)return null;
  if(type.startsWith("datetime")||type.startsWith("timestamp")){
   if(value instanceof List<?> parts){var n=parts.stream().map(x->((Number)x).intValue()).toList();return java.sql.Timestamp.valueOf(java.time.LocalDateTime.of(n.get(0),n.get(1),n.get(2),n.size()>3?n.get(3):0,n.size()>4?n.get(4):0,n.size()>5?n.get(5):0,n.size()>6?n.get(6):0));}
   if(value instanceof String s)return s.replace('T',' ').replaceAll("Z$","").replaceAll("[+]00:00$","");
  }
  if(type.equals("date")&&value instanceof List<?> parts)return java.sql.Date.valueOf(java.time.LocalDate.of(((Number)parts.get(0)).intValue(),((Number)parts.get(1)).intValue(),((Number)parts.get(2)).intValue()));
  return value;
 }
}
