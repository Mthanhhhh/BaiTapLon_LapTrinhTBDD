package com.team.ecommerce.auth.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import java.net.URI;

/** Relays only the authorization result to the fixed app scheme; never accepts a redirect target. */
@RestController
public class MobileOAuthCallbackController {
    @GetMapping("/api/v1/auth/oauth/mobile/callback")
    public ResponseEntity<Void> callback(@RequestParam(required=false) String code,
                                        @RequestParam(required=false) String state,
                                        @RequestParam(required=false) String error) {
        if(state==null || state.isBlank() || state.length()>512 || (code!=null&&code.length()>8192))
            return ResponseEntity.badRequest().build();
        var target=UriComponentsBuilder.fromUriString("eshop://oauth/callback").queryParam("state",state);
        if(error!=null)target.queryParam("error","access_denied");
        else if(code!=null&&!code.isBlank())target.queryParam("code",code);
        else return ResponseEntity.badRequest().build();
        URI uri=target.build().encode().toUri();
        return ResponseEntity.status(HttpStatus.FOUND).location(uri).cacheControl(CacheControl.noStore())
                .header("Referrer-Policy","no-referrer").build();
    }
}
