package com.team.ecommerce.product;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableCaching
@ComponentScan(basePackages = {
    "com.team.ecommerce.product",
    "com.team.ecommerce.shared",
    "com.team.ecommerce.auth.security"
})
@EntityScan(basePackages = {
    "com.team.ecommerce.product.entity",
    "com.team.ecommerce.shared.entity"
})
@EnableJpaRepositories(basePackages = {
    "com.team.ecommerce.product.repository"
})
@EnableTransactionManagement
public class ProductServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }

    @Bean(name = {"transactionManager", "productTransactionManager"})
    public PlatformTransactionManager transactionManager(EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}

