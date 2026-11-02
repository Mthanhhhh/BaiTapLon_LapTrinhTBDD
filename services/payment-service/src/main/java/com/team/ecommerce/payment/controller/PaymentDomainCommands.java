package com.team.ecommerce.payment.controller;
import com.team.ecommerce.shared.integration.DomainCommandHandler;
import org.springframework.stereotype.Component;
import java.util.Map;
@Component public class PaymentDomainCommands implements DomainCommandHandler {
 public Map<String,Object> handle(String action,Map<String,Object> input){throw new IllegalArgumentException("Unsupported payment domain command");}
}
