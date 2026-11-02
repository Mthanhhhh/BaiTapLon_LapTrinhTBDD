package com.team.ecommerce.shared.integration;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.core.annotation.Order;
import java.util.*;
@Component @Order(-190)
@lombok.RequiredArgsConstructor
public class SecurityRequestFilter extends OncePerRequestFilter {
 private final org.springframework.jdbc.core.JdbcTemplate db;
 private static final Set<String> SORTS=Set.of("id","createdAt","updatedAt","name","price","basePrice","minPrice","soldCount","rating","total","status","orderNo","discountPercent","ratingAvg","viewCount","maxPrice","originalPrice","favoriteCount");
 protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws java.io.IOException,ServletException {
  String requestId=UUID.randomUUID().toString();request.setAttribute("security.requestId",requestId);response.setHeader("X-Request-ID",requestId);
  response.setHeader("X-Content-Type-Options","nosniff");response.setHeader("Referrer-Policy","strict-origin-when-cross-origin");
  if(request.getRequestURI().startsWith("/api/")){
   response.setHeader("Cache-Control","no-store");
   if(request.getContentLengthLong()>1024*1024||request.getRequestURI().length()>2048||request.getQueryString()!=null&&request.getQueryString().length()>8192){reject(response,413,"REQUEST_TOO_LARGE");return;}
   try{
    for(String field:List.of("page","size")){String value=request.getParameter(field);if(value!=null){int n=Integer.parseInt(value);if(n<0||field.equals("page")&&n>10000||field.equals("size")&&(n<1||n>100))throw new IllegalArgumentException();}}
    String[] sorts=request.getParameterValues("sort");if(sorts!=null)for(String value:sorts){String[] pieces=value.split(",",-1);if(pieces.length>2||!SORTS.contains(pieces[0])||pieces.length==2&&!Set.of("asc","desc").contains(pieces[1].toLowerCase(Locale.ROOT)))throw new IllegalArgumentException();}
   }catch(IllegalArgumentException invalid){reject(response,400,"INVALID_PAGINATION_OR_SORT");return;}
  }
  try{chain.doFilter(request,response);}finally{
   if(request.getRequestURI().startsWith("/api/")&&Set.of("POST","PUT","PATCH","DELETE").contains(request.getMethod()))try{
    db.update("INSERT INTO domain_audit(actor_id,action,reason) VALUES(?,?,?)",request.getAttribute("security.userId"),"HTTP_"+request.getMethod(),request.getRequestURI().substring(0,Math.min(500,request.getRequestURI().length()))+" status="+response.getStatus()+" request="+requestId);
   }catch(org.springframework.dao.DataAccessException unavailable){org.slf4j.LoggerFactory.getLogger(SecurityRequestFilter.class).warn("Security audit sink unavailable for request {}",requestId);}
  }
 }
 private void reject(HttpServletResponse response,int status,String code)throws java.io.IOException{response.setStatus(status);response.setContentType("application/json");response.getWriter().write("{\"status\":"+status+",\"code\":\""+code+"\",\"message\":\"Tham số không hợp lệ\"}");}
}
