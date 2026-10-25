package com.team.ecommerce.auth.config;

import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
    basePackages = "com.team.ecommerce.auth.repository",
    entityManagerFactoryRef = "authEntityManagerFactory",
    transactionManagerRef = "authTransactionManager"
)
public class AuthDataSourceConfig {

    @Primary
    @Bean
    @ConfigurationProperties("app.datasource.auth")
    public DataSourceProperties authDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Primary
    @Bean
    public DataSource authDataSource() {
        return authDataSourceProperties()
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    @Primary
    @Bean
    public LocalContainerEntityManagerFactoryBean authEntityManagerFactory(
            @Qualifier("authDataSource") DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.team.ecommerce.auth.entity", "com.team.ecommerce.shared.entity");
        em.setPersistenceUnitName("auth");

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        vendorAdapter.setShowSql(false);
        vendorAdapter.setGenerateDdl(false);
        em.setJpaVendorAdapter(vendorAdapter);
        em.setJpaPropertyMap(commonJpaProperties());

        return em;
    }

    @Primary
    @Bean
    public PlatformTransactionManager authTransactionManager(
            @Qualifier("authEntityManagerFactory") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }

    public static Map<String, Object> commonJpaProperties() {
        Map<String, Object> props = new HashMap<>();
        props.put("hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
        props.put("hibernate.hbm2ddl.auto", "none");
        props.put("hibernate.show_sql", "false");
        props.put("hibernate.format_sql", "true");
        props.put("hibernate.jdbc.time_zone", "UTC");
        return props;
    }
}
