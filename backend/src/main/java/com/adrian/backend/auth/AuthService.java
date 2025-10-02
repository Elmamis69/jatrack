package com.adrian.backend.auth;

import com.adrian.backend.auth.dto.AuthRequest;
import com.adrian.backend.auth.dto.AuthResponse;
import com.adrian.backend.auth.dto.RegisterRequest;
import com.adrian.backend.users.Role;
import com.adrian.backend.users.User;
import com.adrian.backend.users.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails; //  IMPORTANTE
import org.springframework.security.core.userdetails.UserDetailsService; // 👈 IMPORTANTE
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService; //  INYECTADO

    public AuthService(
            UserRepository users,
            PasswordEncoder encoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserDetailsService userDetailsService //  INYECTA AQUÍ
    ) {
        this.users = users;
        this.encoder = encoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService; //  ASIGNA AQUÍ
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

        //  Emite el token usando UserDetails (mismo "username" que valida el filtro)
        UserDetails ud = userDetailsService.loadUserByUsername(u.getEmail());
        return new AuthResponse(jwtService.generateToken(ud)); //  UserDetails, no Object
    }

    public AuthResponse login(AuthRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        UserDetails ud = userDetailsService.loadUserByUsername(req.getEmail());
        return new AuthResponse(jwtService.generateToken(ud)); //  UserDetails
    }
}
