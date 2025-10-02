package com.adrian.backend.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;                                  // 👈 IMPORT
import org.slf4j.LoggerFactory;                          // 👈 IMPORT
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class); // 👈 LOGGER

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthFilter(JwtService jwtService, CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        final String uri = request.getRequestURI();  // 👈 URI disponible en todo el método
        final String authHeader = request.getHeader("Authorization");

        log.info("JWT FILTER start uri={} hasHeader={} startsWithBearer={}",
                uri, authHeader != null, (authHeader != null && authHeader.startsWith("Bearer ")));

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.info("JWT FILTER skip (no bearer) uri={}", uri);
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        String email = null;
        try {
            email = jwtService.extractUsername(jwt);
            log.info("JWT FILTER extracted email={} uri={}", email, uri);
        } catch (Exception ex) {
            log.warn("JWT FILTER extractUsername failed uri={} msg={}", uri, ex.getMessage());
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            boolean valid = false;
            try {
                valid = jwtService.isTokenValid(jwt, userDetails);
            } catch (Exception ex) {
                log.warn("JWT FILTER isTokenValid exception uri={} msg={}", uri, ex.getMessage());
            }
            log.info("JWT FILTER isValid={} uri={}", valid, uri);

            if (valid) {
                var authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.info("JWT FILTER set Authentication, authorities={} uri={}",
                        userDetails.getAuthorities(), uri);
            }
        }

        filterChain.doFilter(request, response);
        log.info("JWT FILTER end uri={} authPresent={}",
                uri, SecurityContextHolder.getContext().getAuthentication() != null);
    }
} 
