package com.adrian.backend.auth;
 
import com.adrian.backend.auth.dto.*;
import org.springframework.http.ResponseEntity;
//import org.springframework.security.core.annotation.AuthenticationPrincipal;
//import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

//  imports que faltaban
import java.util.Map;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest req) {
        return ResponseEntity.ok(auth.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest req) {
        return ResponseEntity.ok(auth.login(req));
    }

    //  Usa un SOLO /me para diagnosticar autenticación
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        Map<String, Object> body = Map.of(
                "name", authentication != null ? authentication.getName() : null,
                "principal", authentication != null ? authentication.getPrincipal() : null,
                "authorities", authentication != null ? authentication.getAuthorities() : null
        );
        return ResponseEntity.ok(body);
    }
}
