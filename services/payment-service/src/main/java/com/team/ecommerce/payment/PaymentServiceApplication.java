package com.team.ecommerce.payment;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@ComponentScan(basePackages = {
    "com.team.ecommerce.payment",
    "com.team.ecommerce.order",
    "com.team.ecommerce.auth",
    "com.team.ecommerce.shared"
})
@EntityScan(basePackages = {
    "com.team.ecommerce.payment.entity",
    "com.team.ecommerce.shared.entity"
})
@EnableJpaRepositories(basePackages = {
    "com.team.ecommerce.payment.repository"
})
@EnableTransactionManagement
public class PaymentServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaymentServiceApplication.class, args);
    }

    @Bean(name = {"transactionManager", "paymentTransactionManager"})
    public PlatformTransactionManager transactionManager(EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}

