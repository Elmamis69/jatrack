package com.adrian.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry reg) {
        reg.addMapping("/**")
           .allowedOrigins("http://localhost:5173")
           .allowedMethods("GET","POST","PUT","DELETE","PATCH","OPTIONS")
           .allowedHeaders("*")
           .exposedHeaders("Authorization");
    }
}
