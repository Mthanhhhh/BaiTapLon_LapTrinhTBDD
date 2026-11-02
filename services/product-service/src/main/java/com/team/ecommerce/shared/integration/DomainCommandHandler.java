package com.team.ecommerce.shared.integration;
import java.util.Map;
public interface DomainCommandHandler { Map<String,Object> handle(String action,Map<String,Object> input); }
