package com.team.ecommerce.shared.integration;
import org.springframework.context.annotation.*;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import com.fasterxml.jackson.core.StreamReadConstraints;
@Configuration
public class JsonLimitsConfig {
 @Bean Jackson2ObjectMapperBuilderCustomizer jsonLimits(){return builder->builder.postConfigurer(mapper->mapper.getFactory().setStreamReadConstraints(StreamReadConstraints.builder().maxNestingDepth(32).maxStringLength(200000).maxNumberLength(128).build()));}
}
