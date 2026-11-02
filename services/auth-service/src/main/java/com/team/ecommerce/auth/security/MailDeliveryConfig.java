package com.team.ecommerce.auth.security;
import org.springframework.context.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.*;
@Configuration @ConditionalOnProperty(name="app.mail.enabled",havingValue="true")
public class MailDeliveryConfig {
 @Bean JavaMailSender passwordResetMail(@Value("${SMTP_HOST}")String host,@Value("${SMTP_PORT:587}")int port,@Value("${SMTP_USERNAME}")String username,@Value("${SMTP_PASSWORD}")String password){
  if(host.isBlank()||username.isBlank()||password.isBlank())throw new IllegalArgumentException("Complete SMTP credentials are required when mail is enabled");
  var sender=new JavaMailSenderImpl();sender.setHost(host);sender.setPort(port);sender.setUsername(username);sender.setPassword(password);
  var settings=sender.getJavaMailProperties();settings.setProperty("mail.smtp.auth","true");settings.setProperty("mail.smtp.connectiontimeout","5000");settings.setProperty("mail.smtp.timeout","5000");settings.setProperty("mail.smtp.writetimeout","5000");settings.setProperty("mail.smtp.ssl.checkserveridentity","true");
  if(port==465)settings.setProperty("mail.smtp.ssl.enable","true");else{settings.setProperty("mail.smtp.starttls.enable","true");settings.setProperty("mail.smtp.starttls.required","true");}
  return sender;
 }
}
