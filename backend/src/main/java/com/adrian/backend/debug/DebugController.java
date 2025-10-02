package com.adrian.backend.debug;

import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @GetMapping("/headers")
    public Map<String, String> headers(@RequestHeader HttpHeaders headers) {
        Map<String, String> result = new HashMap<>();
        result.put("authorization", headers.getFirst("Authorization"));
        return result;
    }
}
