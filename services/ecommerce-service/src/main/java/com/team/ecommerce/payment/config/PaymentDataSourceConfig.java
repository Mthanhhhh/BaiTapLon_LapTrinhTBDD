package com.team.ecommerce.payment.config;

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
    basePackages = "com.team.ecommerce.payment.repository",
    entityManagerFactoryRef = "paymentEntityManagerFactory",
    transactionManagerRef = "paymentTransactionManager"
)
public class PaymentDataSourceConfig {

    @Bean
    @ConfigurationProperties("app.datasource.payment")
    public DataSourceProperties paymentDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    public DataSource paymentDataSource() {
        return paymentDataSourceProperties()
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean paymentEntityManagerFactory(
            @Qualifier("paymentDataSource") DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.team.ecommerce.payment.entity", "com.team.ecommerce.shared.entity");
        em.setPersistenceUnitName("payment");

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        vendorAdapter.setShowSql(false);
        vendorAdapter.setGenerateDdl(false);
        em.setJpaVendorAdapter(vendorAdapter);
        em.setJpaPropertyMap(AuthDataSourceConfig.commonJpaProperties());

        return em;
    }

    @Bean
    public PlatformTransactionManager paymentTransactionManager(
            @Qualifier("paymentEntityManagerFactory") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}
