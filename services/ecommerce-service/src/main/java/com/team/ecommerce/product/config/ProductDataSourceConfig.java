package com.team.ecommerce.product.config;

import com.team.ecommerce.auth.config.AuthDataSourceConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
    basePackages = "com.team.ecommerce.product.repository",
    entityManagerFactoryRef = "productEntityManagerFactory",
    transactionManagerRef = "productTransactionManager"
)
public class ProductDataSourceConfig {

    @Bean
    @ConfigurationProperties("app.datasource.product")
    public DataSourceProperties productDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    public DataSource productDataSource() {
        return productDataSourceProperties()
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean productEntityManagerFactory(
            @Qualifier("productDataSource") DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.team.ecommerce.product.entity", "com.team.ecommerce.shared.entity");
        em.setPersistenceUnitName("product");

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        vendorAdapter.setShowSql(false);
        vendorAdapter.setGenerateDdl(false);
        em.setJpaVendorAdapter(vendorAdapter);
        em.setJpaPropertyMap(AuthDataSourceConfig.commonJpaProperties());

        return em;
    }

    @Bean
    public PlatformTransactionManager productTransactionManager(
            @Qualifier("productEntityManagerFactory") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}
