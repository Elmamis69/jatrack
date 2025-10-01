package com.adrian.backend.auth;

import com.adrian.backend.auth.dto.*;
import com.adrian.backend.users.*;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService,
                       UserRepository users, PasswordEncoder encoder) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.users = users;
        this.encoder = encoder;
    }

    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        var u = new User();
        u.setName(req.getName());
        u.setEmail(req.getEmail());
        u.setPassword(encoder.encode(req.getPassword()));
        u.setRole(Role.USER);
        users.save(u);

        return new AuthResponse(jwtService.generate(u.getEmail()));
    }

    public AuthResponse login(AuthRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );
        return new AuthResponse(jwtService.generate(req.getEmail()));
    }
}
