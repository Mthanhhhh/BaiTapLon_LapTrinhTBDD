package com.team.ecommerce.shared.integration;
import org.springframework.context.annotation.*;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.*;
import org.springframework.util.backoff.FixedBackOff;
@Configuration
public class KafkaDeliveryConfig {
 @Bean public DefaultErrorHandler integrationErrorHandler(KafkaTemplate<String,Object> template){
  var recoverer=new DeadLetterPublishingRecoverer(template);recoverer.setFailIfSendResultIsError(true);
  return new DefaultErrorHandler(recoverer,new FixedBackOff(1000L,5L));
 }
}
