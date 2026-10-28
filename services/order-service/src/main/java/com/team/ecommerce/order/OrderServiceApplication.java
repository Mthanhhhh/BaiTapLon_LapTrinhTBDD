package com.team.ecommerce.order;

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
    "com.team.ecommerce.order",
    "com.team.ecommerce.product",
    "com.team.ecommerce.auth",
    "com.team.ecommerce.shared"
})
@EntityScan(basePackages = {
    "com.team.ecommerce.order.entity",
    "com.team.ecommerce.shared.entity"
})
@EnableJpaRepositories(basePackages = {
    "com.team.ecommerce.order.repository"
})
@EnableTransactionManagement
public class OrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }

    @Bean(name = {"transactionManager", "orderTransactionManager"})
    public PlatformTransactionManager transactionManager(EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}

