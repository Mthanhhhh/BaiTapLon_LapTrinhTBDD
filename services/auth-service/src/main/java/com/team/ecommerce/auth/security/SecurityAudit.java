package com.team.ecommerce.auth.security;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** Never records passwords, OTPs, authorization headers or raw session tokens. */
@Service
@RequiredArgsConstructor
public class SecurityAudit {
    private final JdbcTemplate db;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordIndependent(String event, Long user, String outcome) { record(event,user,outcome); }

    @Transactional
    public void record(String event, Long user, String outcome) {
        String requestId = null;
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            Object id = attributes.getRequest().getAttribute("security.requestId");
            if (id != null) requestId = id.toString();
        }
        db.update("INSERT INTO security_audit(user_id,event_type,outcome,request_id) VALUES(?,?,?,?)",
                user, event, outcome, requestId);
    }
}
