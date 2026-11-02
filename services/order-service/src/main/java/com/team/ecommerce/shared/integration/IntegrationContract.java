package com.team.ecommerce.shared.integration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import java.util.*;

@Component
public class IntegrationContract {
 public record Column(String name,String type,boolean nullable,boolean pk){}
 public record Table(List<Column> columns,List<String> keys,String query,String target){}
 public record Definition(String source,Map<String,Table> exports,Map<String,Table> imports){}
 public final Definition definition;
 public IntegrationContract(ObjectMapper mapper)throws java.io.IOException{
  try(var stream=new ClassPathResource("integration-tables.json").getInputStream()){definition=mapper.readValue(stream,Definition.class);}
 }
 public Table exported(String table){var value=definition.exports().get(table);if(value==null)throw new IllegalArgumentException("Unknown integration contract");return value;}
 public String select(String table){var t=exported(table);return t.query()!=null?t.query():"SELECT "+t.columns().stream().map(c->"`"+c.name()+"`").collect(java.util.stream.Collectors.joining(","))+" FROM `"+table+"`";}
}
