package com.team.ecommerce.product.controller;
import com.team.ecommerce.shared.integration.*;
import com.team.ecommerce.product.service.InventoryOwnerService;
import com.team.ecommerce.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

@RestController @RequestMapping("/internal/domain") @RequiredArgsConstructor
@Transactional("productTransactionManager")
public class ProductDomainController implements DomainCommandHandler {
 private final com.team.ecommerce.shared.integration.DomainOutbox outbox;private final JdbcTemplate db;private final IntegrationClient clients;private final InventoryOwnerService inventory;private final ObjectMapper json;
 @GetMapping("/shops/mine/{user}")public Map<String,Object> mine(@PathVariable long user){var rows=db.queryForList("SELECT id,name,description,province,status FROM shops WHERE owner_user_id=? AND deleted_at IS NULL",user);var result=new HashMap<String,Object>();result.put("shop",rows.isEmpty()?null:rows.get(0));return result;}
 @GetMapping("/products/{product}/owner/{user}")public Map<String,Object> owns(@PathVariable long product,@PathVariable long user){return Map.of("owns",db.queryForObject("SELECT COUNT(*) FROM products p JOIN shops s ON s.id=p.shop_id WHERE p.id=? AND s.owner_user_id=? AND s.status='ACTIVE' AND s.deleted_at IS NULL",Long.class,product,user)>0);}
 @GetMapping("/shop-profile/{id}")public Map<String,Object> profile(@PathVariable long id,@RequestParam long actor){clients.requireAdmin(actor);var rows=db.queryForList("SELECT profile_json FROM shop_business_profiles WHERE shop_id=?",String.class,id);try{return Map.of("profile",rows.isEmpty()?Map.of():json.readValue(rows.get(0),Map.class));}catch(java.io.IOException e){throw new BadRequestException("Không đọc được hồ sơ.");}}
 @Override @PostMapping("/{action}")public Map<String,Object> handle(@PathVariable String action,@RequestBody Map<String,Object> input){
  if(action.equals("inventory-reserve"))return inventory.reserve(input);
  if(action.startsWith("inventory-")&&Set.of("inventory-release","inventory-commit","inventory-delivered","inventory-return").contains(action))return inventory.movement(action.substring(10),input);
  long actor=((Number)input.get("actor")).longValue();
  if(action.equals("register-shop"))return register(actor,(Map<String,String>)input.get("profile"));
  if(action.equals("reply-review")){
   String reply=Objects.toString(input.get("reply"),"").trim();if(reply.isEmpty()||reply.length()>2000)throw new BadRequestException("Phản hồi cần 1–2.000 ký tự.");
   int changed=db.update("UPDATE reviews r JOIN products p ON p.id=r.product_id JOIN shops s ON s.id=p.shop_id SET r.seller_reply=?,r.seller_replied_at=UTC_TIMESTAMP(3) WHERE r.id=? AND s.owner_user_id=? AND s.status='ACTIVE' AND r.deleted_at IS NULL",reply,input.get("id"),actor);if(changed==0)throw new AccessDeniedException("Đánh giá không thuộc shop.");return Map.of("success",true);
  }
  clients.requireAdmin(actor);String status=Objects.toString(input.get("status"),""),type=Objects.toString(input.get("type"),"");long id=((Number)input.get("id")).longValue();String table;Set<String> allowed;
  switch(type){case "shops"->{table="shops";allowed=Set.of("ACTIVE","SUSPENDED");}case "products"->{table="products";allowed=Set.of("ACTIVE","HIDDEN","BANNED");if(status.equals("ACTIVE")&&db.queryForObject("SELECT COUNT(*) FROM products WHERE id=? AND (thumbnail_url IS NULL OR TRIM(thumbnail_url)='')",Long.class,id)>0)throw new BadRequestException("Cần ảnh trước khi hiển thị.");}case "reviews"->{table="reviews";allowed=Set.of("VISIBLE","HIDDEN");}default->throw new BadRequestException("Lệnh catalog không hợp lệ.");}
  if(!action.equals("moderate")||!allowed.contains(status))throw new BadRequestException("Trạng thái không hợp lệ.");
  if(db.update("UPDATE "+table+" SET status=? WHERE id=? AND deleted_at IS NULL",status,id)==0)throw new BadRequestException("Không tìm thấy bản ghi.");
  if(type.equals("reviews"))db.update("UPDATE products p JOIN reviews target ON target.product_id=p.id SET p.rating_count=(SELECT COUNT(*) FROM reviews r WHERE r.product_id=p.id AND r.deleted_at IS NULL AND r.status='VISIBLE'),p.rating_avg=COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id=p.id AND r.deleted_at IS NULL AND r.status='VISIBLE'),0) WHERE target.id=?",id);
  db.update("INSERT INTO domain_audit(actor_id,action,entity_id,reason) VALUES(?,?,?,?)",actor,"MODERATE_"+type,id,Objects.toString(input.get("reason"),""));return Map.of("success",true);
 }
 private Map<String,Object> register(long actor,Map<String,String> input){
  if(clients.admin(actor))throw new AccessDeniedException("Quản trị viên không mở shop.");
  var previous=mine(actor);if(previous.get("shop")!=null)return (Map<String,Object>)previous.get("shop");
  for(String key:List.of("name","province","ward","street","contactName","phone","email","description"))if(input.getOrDefault(key,"").isBlank())throw new BadRequestException("Vui lòng điền đủ hồ sơ shop.");
  if(input.get("name").length()>150||!input.get("phone").matches("(?:0|\\+84)[0-9]{9,10}")||!input.get("email").matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")||!"true".equals(input.get("accepted")))throw new BadRequestException("Kiểm tra tên, điện thoại, email và điều khoản.");
  for(String value:input.values())if(value!=null&&value.length()>3000)throw new BadRequestException("Thông tin quá dài.");
  for(String key:List.of("logoUrl","bannerUrl")){String url=input.getOrDefault(key,"");if(!url.isBlank()&&!url.startsWith("https://"))throw new BadRequestException("Ảnh cần URL HTTPS.");}
  db.update("INSERT INTO shops(owner_user_id,name,slug,description,province,status,logo_url,banner_url) VALUES(?,?,?,?,?,'ACTIVE',?,?)",actor,input.get("name").trim(),"shop-"+actor,input.get("description"),input.get("province"),input.get("logoUrl"),input.get("bannerUrl"));
  var shop=(Map<String,Object>)mine(actor).get("shop");var profile=new LinkedHashMap<String,String>();for(String key:List.of("contactName","phone","email","ward","street","businessType","taxCode","returnAddress","supportPolicy","openingHours","leadDays"))profile.put(key,input.getOrDefault(key,""));try{db.update("INSERT INTO shop_business_profiles(shop_id,profile_json) VALUES(?,?)",shop.get("id"),json.writeValueAsString(profile));}catch(java.io.IOException e){throw new BadRequestException("Hồ sơ không hợp lệ.");}outbox.enqueue("auth","grant-seller",Map.of("userId",actor),"grant-seller:"+actor);return shop;
 }
}
