package com.team.ecommerce.shared.integration;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import static org.mockito.Mockito.mock;
import static org.assertj.core.api.Assertions.assertThat;
class OutboxWiringTest {
 @Test void commandHandlerCanPublishAnotherCommandWithoutCircularStartup(){
  new ApplicationContextRunner().withUserConfiguration(Wiring.class).run(context->{assertThat(context).hasNotFailed();assertThat(context).hasSingleBean(DomainOutbox.class);assertThat(context).hasSingleBean(DomainCommandHandler.class);});
 }
 @Configuration @Import(DomainOutbox.class) static class Wiring {
  @Bean JdbcTemplate db(){return mock(JdbcTemplate.class);}
  @Bean ObjectMapper json(){return new ObjectMapper();}
  @Bean KafkaTemplate<String,Object> kafka(){return mock(KafkaTemplate.class);}
  @Bean IntegrationContract contract(){return mock(IntegrationContract.class);}
  @Bean PlatformTransactionManager manager(){return mock(PlatformTransactionManager.class);}
  @Bean DomainCommandHandler handler(DomainOutbox outbox){return (action,input)->java.util.Map.of("success",true);}
 }
}
