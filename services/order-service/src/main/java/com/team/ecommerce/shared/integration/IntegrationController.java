package com.team.ecommerce.shared.integration;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@RestController @RequestMapping("/internal/integration") @RequiredArgsConstructor
public class IntegrationController {
 private final IntegrationContract contract;private final JdbcTemplate db;
 @GetMapping("/snapshot/{table}") @Transactional(readOnly=true)
 public Map<String,Object> snapshot(@PathVariable String table,@RequestParam(defaultValue="0")int offset){
  var definition=contract.exported(table);long version=db.queryForObject("SELECT COALESCE(MAX(id),0) FROM service_outbox",Long.class);
  String order=definition.keys().stream().map(k->(definition.query()!=null?"o.":"")+"`"+k+"`").collect(java.util.stream.Collectors.joining(","));
  return Map.of("version",version,"rows",db.queryForList(contract.select(table)+" ORDER BY "+order+" LIMIT 500 OFFSET ?",Math.max(0,offset)));
 }
}
