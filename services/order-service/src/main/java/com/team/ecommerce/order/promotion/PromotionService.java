package com.team.ecommerce.order.promotion;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.ecommerce.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import java.math.*;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import static com.team.ecommerce.order.promotion.PromotionModels.*;

@Service
@RequiredArgsConstructor
@Transactional("orderTransactionManager")
public class PromotionService {
 private final JdbcTemplate db;
 private final PromotionEvents events;
 private final ObjectMapper json=new ObjectMapper().findAndRegisterModules();
 static BigDecimal money(Object v){return v==null?BigDecimal.ZERO:new BigDecimal(v.toString()).setScale(0,RoundingMode.HALF_UP);}
 static long number(Object v){return v==null?0:((Number)v).longValue();}
 static Instant instant(Object value){return value instanceof Timestamp t?t.toInstant():value instanceof java.time.LocalDateTime t?t.toInstant(ZoneOffset.UTC):Instant.parse(value.toString());}
 static boolean flag(Object v){return Boolean.TRUE.equals(v)||(v instanceof Number n&&n.intValue()!=0);}
 static void require(boolean ok,String message){if(!ok)throw new BadRequestException(message);}
 public static BigDecimal discount(String type,BigDecimal value,BigDecimal cap,BigDecimal base){
  BigDecimal amount="PERCENT".equals(type)?base.multiply(value).divide(BigDecimal.valueOf(100),0,RoundingMode.HALF_UP):value;
  if(cap!=null)amount=amount.min(cap);return amount.max(BigDecimal.ZERO).min(base).setScale(0,RoundingMode.HALF_UP);
 }
 public boolean admin(long user){return db.queryForObject("SELECT COUNT(*) FROM auth_db.user_roles ur JOIN auth_db.roles r ON r.id=ur.role_id JOIN auth_db.users u ON u.id=ur.user_id WHERE ur.user_id=? AND r.code='ADMIN' AND u.status='ACTIVE' AND u.deleted_at IS NULL",Long.class,user)>0;}
 public Long shop(long user){var r=db.queryForList("SELECT id FROM product_db.shops WHERE owner_user_id=? AND status='ACTIVE' AND deleted_at IS NULL",user);return r.isEmpty()?null:number(r.get(0).get("id"));}
 private void own(long user,Map<String,Object> c){if(c.get("shop_id")==null){if(!admin(user))throw new AccessDeniedException("Chỉ quản trị viên được quản lý chương trình của sàn");}else if(!admin(user)&&!Objects.equals(shop(user),number(c.get("shop_id"))))throw new AccessDeniedException("Chương trình không thuộc shop của bạn");}
 private Map<String,Object> campaign(long id){var r=db.queryForList("SELECT * FROM promo_campaigns WHERE id=?",id);require(!r.isEmpty(),"Không tìm thấy chương trình");return r.get(0);}
 private boolean audience(long user,long campaign){
  var rows=db.queryForList("SELECT audience FROM promo_audience WHERE campaign_id=?",campaign);String type=rows.isEmpty()?"ALL":rows.get(0).get("audience").toString();
  if("ALL".equals(type))return true;
  if(user<=0)return false;
  if("SELECTED".equals(type))return db.queryForObject("SELECT COUNT(*) FROM promo_recipients WHERE campaign_id=? AND user_id=?",Long.class,campaign,user)>0;
  boolean returning=db.queryForObject("SELECT COUNT(*) FROM orders WHERE user_id=? AND status IN ('DELIVERED','RETURNED')",Long.class,user)>0;
  return "RETURNING".equals(type)?returning:!returning;
 }
 private String phase(Map<String,Object> c){Instant now=Instant.now();if(!"ACTIVE".equals(c.get("status")))return "CANCELLED";if(instant(c.get("starts_at")).isAfter(now))return "UPCOMING";if(!instant(c.get("ends_at")).isAfter(now))return "ENDED";return "LIVE";}
 private int used(long user,long id){return db.queryForObject("SELECT COUNT(*) FROM promo_redemptions d JOIN promo_reservations r ON r.order_id=d.order_id WHERE r.user_id=? AND d.campaign_id=? AND r.state<>'RELEASED'",Integer.class,user,id);}
 private BigDecimal budgetLeft(Map<String,Object> c){return money(c.get("budget_total")).subtract(money(c.get("budget_spent"))).subtract(money(c.get("budget_reserved")));}
 private void redact(Map<String,Object> c){for(String key:List.of("budget_total","budget_reserved","budget_spent","budgetRemaining","created_by"))c.remove(key);}
 private boolean available(Map<String,Object> c){return "LIVE".equals(phase(c))&&number(c.get("quota_total"))>number(c.get("quota_used"))+number(c.get("quota_reserved"))&&budgetLeft(c).signum()>0;}
 public List<Map<String,Object>> catalog(Long user,boolean wallet,boolean manage){
  List<Map<String,Object>> rows;
  if(manage){Long shopId=shop(user);rows=admin(user)?db.queryForList("SELECT * FROM promo_campaigns ORDER BY id DESC"):shopId==null?List.of():db.queryForList("SELECT * FROM promo_campaigns WHERE shop_id=? ORDER BY id DESC",shopId);}
  else if(wallet){rows=db.queryForList("SELECT c.* FROM promo_campaigns c JOIN promo_wallet w ON w.campaign_id=c.id WHERE w.user_id=? ORDER BY c.ends_at,c.id",user);}
  else rows=db.queryForList("SELECT * FROM promo_campaigns WHERE status='ACTIVE' AND ends_at>UTC_TIMESTAMP(3) ORDER BY starts_at,id");
  if(!manage)rows.removeIf(c->user==null?!"ALL".equals(db.queryForList("SELECT audience FROM promo_audience WHERE campaign_id=?",String.class,c.get("id")).stream().findFirst().orElse("ALL")):!audience(user,number(c.get("id"))));
  for(var c:rows){c.put("audience",db.queryForList("SELECT audience FROM promo_audience WHERE campaign_id=?",String.class,c.get("id")).stream().findFirst().orElse("ALL"));c.put("phase",phase(c));c.put("remaining",number(c.get("quota_total"))-number(c.get("quota_used"))-number(c.get("quota_reserved")));c.put("budgetRemaining",budgetLeft(c));
   c.put("startsAt",instant(c.get("starts_at")).toString());c.put("endsAt",instant(c.get("ends_at")).toString());
   c.put("saved",user!=null&&db.queryForObject("SELECT COUNT(*) FROM promo_wallet WHERE user_id=? AND campaign_id=?",Integer.class,user,c.get("id"))>0);
   c.put("userUsed",user==null?0:used(user,number(c.get("id"))));
   c.put("reminder",user!=null&&db.queryForObject("SELECT COUNT(*) FROM promo_reminders WHERE user_id=? AND campaign_id=?",Integer.class,user,c.get("id"))>0);
   if("FLASH".equals(c.get("kind"))){var items=db.queryForList("SELECT f.*,p.name,p.thumbnail_url,p.status AS product_status,p.deleted_at AS product_deleted,s.deleted_at AS sku_deleted,s.price AS base_price,s.name AS variant_name,s.stock_quantity FROM promo_flash_items f JOIN product_db.products p ON p.id=f.product_id JOIN product_db.product_skus s ON s.id=f.sku_id WHERE f.campaign_id=? ORDER BY f.id",c.get("id"));for(var item:items){BigDecimal saving=money(item.get("base_price")).subtract(money(item.get("sale_price")));long left=Math.min(number(item.get("stock_quantity")),number(item.get("quota_total"))-number(item.get("quota_used"))-number(item.get("quota_reserved")));left=saving.signum()>0&&"ACTIVE".equals(item.get("product_status"))&&item.get("product_deleted")==null&&item.get("sku_deleted")==null?Math.min(left,budgetLeft(c).divideToIntegralValue(saving).longValue()):0;item.put("remaining",Math.max(0,left));long prior=user==null?0:db.queryForObject("SELECT COALESCE(SUM(f.quantity),0) FROM promo_flash_reservations f JOIN promo_reservations r ON r.order_id=f.order_id WHERE f.flash_item_id=? AND r.user_id=? AND r.state<>'RELEASED'",Long.class,item.get("id"),user);item.put("userRemaining",Math.max(0,number(item.get("per_user_limit"))-prior));item.remove("product_deleted");item.remove("sku_deleted");}c.put("items",items);}
   if(!manage)redact(c);
  }return rows;
 }
 public long create(long user,CampaignInput input){
  require(input.name()!=null&&!input.name().isBlank()&&input.name().length()<=150,"Tên chương trình không hợp lệ");
  require(Set.of("VOUCHER","FLASH").contains(Objects.toString(input.kind(),"")),"Loại chương trình không hợp lệ");
  require(Set.of("SHOP","PLATFORM","SHIPPING","FLASH").contains(Objects.toString(input.layer(),"")),"Phạm vi không hợp lệ");
  boolean flash="FLASH".equals(input.kind());require(flash=="FLASH".equals(input.layer()),"Flash sale cần đúng phạm vi FLASH");
  Long shopId=(flash||"SHOP".equals(input.layer())||!admin(user))?shop(user):null;
  if(shopId==null&&!admin(user))throw new AccessDeniedException("Hãy mở shop trước khi tạo ưu đãi");
  if("PLATFORM".equals(input.layer())&&!admin(user))throw new AccessDeniedException("Chỉ quản trị viên được tạo mã sàn");
  if(flash||"SHOP".equals(input.layer()))require(shopId!=null,"Chương trình phải thuộc một shop đang hoạt động");
  Instant start,end;try{start=Instant.parse(input.startsAt());end=Instant.parse(input.endsAt());}catch(Exception e){throw new BadRequestException("Thời gian phải có múi giờ ISO-8601");}
  require(end.isAfter(start)&&end.isAfter(Instant.now())&&Duration.between(start,end).toDays()<=366,"Khoảng thời gian không hợp lệ");
  require(input.budget()!=null&&input.budget().signum()>0&&input.budget().compareTo(new BigDecimal("999999999999"))<=0,"Ngân sách phải lớn hơn 0");
  require(input.perUserLimit()>0&&input.perUserLimit()<=99,"Giới hạn mỗi khách phải từ 1 đến 99");
  String code=flash?null:Objects.toString(input.code(),"").trim().toUpperCase(Locale.ROOT);
  if(!flash){require(code.matches("[A-Z0-9_-]{3,40}"),"Mã gồm 3–40 ký tự chữ, số, _ hoặc -");require(input.quota()>0,"Lượt sử dụng phải lớn hơn 0");
   require(Set.of("FIXED","PERCENT").contains(Objects.toString(input.discountType(),"")),"Kiểu giảm không hợp lệ");require(input.value()!=null&&input.value().signum()>0&&(!"PERCENT".equals(input.discountType())||input.value().compareTo(BigDecimal.valueOf(100))<=0),"Mức giảm không hợp lệ");}
  require(input.minOrder()==null||input.minOrder().signum()>=0,"Đơn tối thiểu không hợp lệ");require(input.maxDiscount()==null||input.maxDiscount().signum()>0,"Trần giảm phải lớn hơn 0");
  int quota=input.quota();
  if(flash){require(input.items()!=null&&!input.items().isEmpty()&&input.items().size()<=100,"Cần 1–100 phân loại flash sale");quota=0;require(input.items().stream().allMatch(i->i.skuId()!=null),"Cần chọn phân loại");Set<Long> skus=new HashSet<>();
   for(var item:input.items().stream().sorted(Comparator.comparing(FlashInput::skuId)).toList()){
    require(item.skuId()!=null&&skus.add(item.skuId()),"Phân loại không hợp lệ hoặc trùng lặp");
    var sku=db.queryForList("SELECT s.*,p.shop_id,p.status AS product_status FROM product_db.product_skus s JOIN product_db.products p ON p.id=s.product_id WHERE s.id=? AND s.deleted_at IS NULL AND p.deleted_at IS NULL FOR UPDATE",item.skuId());
    require(!sku.isEmpty()&&Objects.equals(number(sku.get(0).get("shop_id")),shopId)&&"ACTIVE".equals(sku.get(0).get("product_status")),"Phân loại không thuộc sản phẩm đang bán của shop");
    require(item.salePrice()!=null&&item.salePrice().signum()>0&&item.salePrice().compareTo(money(sku.get(0).get("price")))<0,"Giá flash sale phải thấp hơn giá hiện tại và lớn hơn 0");
    require(item.quota()>0&&item.quota()<=number(sku.get(0).get("stock_quantity"))&&item.perUserLimit()>0&&item.perUserLimit()<=item.quota(),"Quota hoặc giới hạn phân loại không hợp lệ");
    require(db.queryForObject("SELECT COUNT(*) FROM promo_flash_items f JOIN promo_campaigns c ON c.id=f.campaign_id WHERE f.sku_id=? AND c.status='ACTIVE' AND c.starts_at<? AND c.ends_at>?",Integer.class,item.skuId(),Timestamp.from(end),Timestamp.from(start))==0,"Phân loại đã có flash sale trùng thời gian");quota=Math.addExact(quota,item.quota());
   }
  }
  org.springframework.jdbc.support.KeyHolder key=new org.springframework.jdbc.support.GeneratedKeyHolder(); final int totalQuota=quota;final Long owner=shopId;
  db.update(connection->{var ps=connection.prepareStatement("INSERT INTO promo_campaigns(name,kind,layer,shop_id,code,discount_type,value,min_order,max_discount,budget_total,quota_total,per_user_limit,stackable,starts_at,ends_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",java.sql.Statement.RETURN_GENERATED_KEYS);
   Object[] values={input.name().trim(),input.kind(),input.layer(),owner,code,flash?"FIXED":input.discountType(),flash?0:money(input.value()),money(input.minOrder()),input.maxDiscount(),money(input.budget()),totalQuota,input.perUserLimit(),!Boolean.FALSE.equals(input.stackable()),Timestamp.from(start),Timestamp.from(end),user};for(int i=0;i<values.length;i++)ps.setObject(i+1,values[i]);return ps;},key);
  long id=key.getKey().longValue();
  String audience=Objects.toString(input.audience(),"ALL");require(Set.of("ALL","NEW_BUYER","RETURNING","SELECTED").contains(audience),"Nhóm khách không hợp lệ");
  db.update("INSERT INTO promo_audience(campaign_id,audience) VALUES(?,?)",id,audience);
  if("SELECTED".equals(audience)){
   require(input.recipientIds()!=null&&!input.recipientIds().isEmpty()&&input.recipientIds().size()<=1000,"Chọn 1–1.000 người nhận");
   for(Long recipient:new HashSet<>(input.recipientIds())){require(recipient!=null&&db.queryForObject("SELECT COUNT(*) FROM auth_db.users WHERE id=? AND status='ACTIVE' AND deleted_at IS NULL",Long.class,recipient)>0,"Người nhận không hợp lệ");db.update("INSERT INTO promo_recipients(campaign_id,user_id) VALUES(?,?)",id,recipient);}
  }
  if(!flash)db.update("INSERT INTO auth_db.app_notifications(user_id,event_key,type,title,body) SELECT u.id,?,'PROMOTION',?,? FROM auth_db.users u WHERE u.status='ACTIVE' AND u.deleted_at IS NULL AND (?<>'SELECTED' OR EXISTS(SELECT 1 FROM promo_recipients pr WHERE pr.campaign_id=? AND pr.user_id=u.id)) AND (?<>'NEW_BUYER' OR NOT EXISTS(SELECT 1 FROM orders o WHERE o.user_id=u.id AND o.status IN ('DELIVERED','RETURNED'))) AND (?<>'RETURNING' OR EXISTS(SELECT 1 FROM orders o WHERE o.user_id=u.id AND o.status IN ('DELIVERED','RETURNED')))","campaign-"+id,input.name().trim(),"Mã "+code+" · Xem điều kiện trong kho ưu đãi",audience,id,audience,audience);
  if(flash)for(var item:input.items())db.update("INSERT INTO promo_flash_items(campaign_id,product_id,sku_id,sale_price,quota_total,per_user_limit) SELECT ?,product_id,id,?,?,? FROM product_db.product_skus WHERE id=?",id,money(item.salePrice()),item.quota(),item.perUserLimit(),item.skuId());
  events.enqueue("CAMPAIGN_CREATED",Map.of("campaignId",id));return id;
 }
 public void cancel(long user,long id){var c=campaign(id);own(user,c);db.update("UPDATE promo_campaigns SET status='CANCELLED' WHERE id=?",id);events.enqueue("CAMPAIGN_CANCELLED",Map.of("campaignId",id));}
 public void save(long user,long id){require(audience(user,id),"Voucher không dành cho tài khoản này");var c=campaign(id);require("VOUCHER".equals(c.get("kind")),"Chỉ lưu voucher vào kho");require(!Set.of("ENDED","CANCELLED").contains(phase(c)),"Mã đã kết thúc");db.update("INSERT IGNORE INTO promo_wallet(user_id,campaign_id) VALUES(?,?)",user,id);}
 public void unsave(long user,long id){db.update("DELETE FROM promo_wallet WHERE user_id=? AND campaign_id=?",user,id);}
 public void remind(long user,long id,boolean enabled){require(audience(user,id),"Ưu đãi không dành cho tài khoản này");var c=campaign(id);require("UPCOMING".equals(phase(c)),"Chỉ nhắc chương trình chưa bắt đầu");if(enabled)db.update("INSERT IGNORE INTO promo_reminders(user_id,campaign_id) VALUES(?,?)",user,id);else db.update("DELETE FROM promo_reminders WHERE user_id=? AND campaign_id=?",user,id);}
 public void shipping(long user,BigDecimal fee){Long id=shop(user);if(id==null)throw new AccessDeniedException("Chưa mở shop");require(fee!=null&&fee.signum()>=0&&fee.compareTo(new BigDecimal("1000000"))<=0,"Phí giao hàng không hợp lệ");db.update("INSERT INTO promo_shipping_policy(shop_id,fee) VALUES(?,?) ON DUPLICATE KEY UPDATE fee=VALUES(fee)",id,money(fee));events.enqueue("SHIPPING_CHANGED",Map.of("shopId",id));}
 public List<Map<String,Object>> productPrices(Long user,List<Long> ids){
  require(ids!=null&&!ids.isEmpty()&&ids.size()<=60,"Cần 1–60 sản phẩm");var result=new ArrayList<Map<String,Object>>();
  var reads=new PriceReadContext();
  for(Long id:new LinkedHashSet<>(ids)){
   var skus=db.queryForList("SELECT s.id FROM product_db.product_skus s JOIN product_db.products p ON p.id=s.product_id WHERE p.id=? AND p.status='ACTIVE' AND p.deleted_at IS NULL AND s.deleted_at IS NULL AND s.stock_quantity>0 ORDER BY s.price,s.id LIMIT 1",Long.class,id);
   if(skus.isEmpty())continue;
   var candidates=new LinkedHashSet<>(skus);candidates.addAll(db.queryForList("SELECT f.sku_id FROM promo_flash_items f JOIN promo_campaigns c ON c.id=f.campaign_id WHERE f.product_id=? AND c.status='ACTIVE' AND c.starts_at<=UTC_TIMESTAMP(3) AND c.ends_at>UTC_TIMESTAMP(3)",Long.class,id));
   Quote best=null;for(Long sku:candidates)try{Quote q=quote(user==null?0:user,new QuoteInput(List.of(),true,null,sku,1),reads);if(best==null||q.subtotal().subtract(q.discount()).compareTo(best.subtotal().subtract(best.discount()))<0)best=q;}catch(BadRequestException ignored){}
   if(best!=null){var offer=new LinkedHashMap<String,Object>();offer.put("productId",id);offer.put("skuId",best.lines().get(0).skuId());offer.put("shopPrice",best.subtotal());offer.put("afterVoucher",best.subtotal().subtract(best.discount()));offer.put("basePrice",best.lines().get(0).basePrice());offer.put("applied",best.applied());offer.put("note","Giá cho 1 sản phẩm; phí giao hàng tính riêng. Chỉ gồm mã tài khoản đủ điều kiện.");result.add(offer);}
  }return result;
 }
 // Per-request only: reuse reference reads across listing SKUs, never across buyers or checkout calls.
 static final class PriceReadContext {
  private final Map<String,Object> values=new HashMap<>();
  @SuppressWarnings("unchecked")
  <T> T read(String key,java.util.function.Supplier<T> loader){return (T)values.computeIfAbsent(key,k->loader.get());}
 }
 private <T> T read(PriceReadContext context,String key,java.util.function.Supplier<T> loader){return context==null?loader.get():context.read(key,loader);}
 public Quote quote(long user,QuoteInput input){return quote(user,input,null);}
 private Quote quote(long user,QuoteInput input,PriceReadContext reads){
  var items=db.queryForList("SELECT ci.id AS cart_item_id,ci.quantity,s.id AS sku_id,s.price,s.stock_quantity,s.name AS variant_name,p.id AS product_id,p.shop_id,p.name,p.thumbnail_url FROM cart_items ci JOIN carts cart ON cart.id=ci.cart_id JOIN product_db.product_skus s ON s.id=ci.sku_id AND s.product_id=ci.product_id JOIN product_db.products p ON p.id=s.product_id WHERE cart.user_id=? AND EXISTS(SELECT 1 FROM product_db.shops sh WHERE sh.id=p.shop_id AND sh.status='ACTIVE' AND sh.deleted_at IS NULL) AND p.status='ACTIVE' AND p.deleted_at IS NULL AND s.deleted_at IS NULL ORDER BY s.id",user);
  if(input!=null&&input.skuId()!=null){
   require(input.cartItemIds()==null,"Chỉ chọn mua ngay hoặc giỏ hàng");
   int quantity=input.quantity()==null?1:input.quantity();require(quantity>0&&quantity<=99,"Số lượng từ 1 đến 99");
   items=db.queryForList("SELECT -s.id AS cart_item_id,? AS quantity,s.id AS sku_id,s.price,s.stock_quantity,s.name AS variant_name,p.id AS product_id,p.shop_id,p.name,p.thumbnail_url FROM product_db.product_skus s JOIN product_db.products p ON p.id=s.product_id JOIN product_db.shops sh ON sh.id=p.shop_id WHERE s.id=? AND s.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='ACTIVE' AND sh.status='ACTIVE' AND sh.deleted_at IS NULL",quantity,input.skuId());
  }else if(input!=null&&input.cartItemIds()!=null){
   var ids=new HashSet<>(input.cartItemIds());require(!ids.isEmpty()&&ids.size()<=100,"Chọn 1–100 sản phẩm");items.removeIf(i->!ids.contains(number(i.get("cart_item_id"))));require(items.size()==ids.size(),"Một số dòng giỏ hàng không còn hợp lệ hoặc không thuộc bạn");
  }else require(items.size()==db.queryForObject("SELECT COUNT(*) FROM cart_items ci JOIN carts c ON c.id=ci.cart_id WHERE c.user_id=?",Integer.class,user),"Giỏ hàng có phân loại không hợp lệ");
  require(!items.isEmpty(),"Chưa chọn sản phẩm thanh toán");
  long shopId=number(items.get(0).get("shop_id"));require(items.stream().allMatch(i->number(i.get("shop_id"))==shopId),"Vui lòng đặt riêng sản phẩm từng shop");
  var campaigns=read(reads,"campaigns:"+shopId,()->db.queryForList("SELECT * FROM promo_campaigns WHERE kind='VOUCHER' AND (shop_id IS NULL OR shop_id=?) ORDER BY id",shopId));
  List<Line> lines=new ArrayList<>();boolean allowVouchers=true;
  for(var item:items){int qty=(int)number(item.get("quantity"));require(qty>0&&qty<=99&&qty<=number(item.get("stock_quantity")),"Không đủ tồn kho cho "+item.get("name"));BigDecimal base=money(item.get("price")),price=base;
   var sales=db.queryForList("SELECT discount_percent FROM commerce_product_sales WHERE product_id=? AND starts_at<=UTC_TIMESTAMP(3) AND ends_at>UTC_TIMESTAMP(3)",item.get("product_id"));
   if(!sales.isEmpty())price=base.subtract(discount("PERCENT",new BigDecimal(sales.get(0).get("discount_percent").toString()),null,base));
   Long flashId=null,flashCampaign=null;
   var offers=db.queryForList("SELECT f.*,c.budget_total,c.budget_reserved,c.budget_spent,c.stackable FROM promo_flash_items f JOIN promo_campaigns c ON c.id=f.campaign_id WHERE f.sku_id=? AND c.status='ACTIVE' AND c.starts_at<=UTC_TIMESTAMP(3) AND c.ends_at>UTC_TIMESTAMP(3) ORDER BY f.id",item.get("sku_id"));
   for(var f:offers){int prior=db.queryForObject("SELECT COALESCE(SUM(fr.quantity),0) FROM promo_flash_reservations fr JOIN promo_reservations r ON r.order_id=fr.order_id WHERE fr.flash_item_id=? AND r.user_id=? AND r.state<>'RELEASED'",Integer.class,f.get("id"),user);BigDecimal saving=base.subtract(money(f.get("sale_price"))).multiply(BigDecimal.valueOf(qty));
    if(number(f.get("quota_total"))-number(f.get("quota_reserved"))-number(f.get("quota_used"))>=qty&&prior+qty<=number(f.get("per_user_limit"))&&saving.signum()>0&&money(f.get("sale_price")).compareTo(price)<0&&saving.compareTo(budgetLeft(f))<=0){price=money(f.get("sale_price"));flashId=number(f.get("id"));flashCampaign=number(f.get("campaign_id"));allowVouchers&=flag(f.get("stackable"));break;}}
   lines.add(new Line(number(item.get("cart_item_id")),number(item.get("product_id")),number(item.get("sku_id")),shopId,item.get("name").toString(),Objects.toString(item.get("variant_name"),""),Objects.toString(item.get("thumbnail_url"),""),qty,base,price,flashId,flashCampaign));
  }
  BigDecimal subtotal=lines.stream().map(Line::subtotal).reduce(BigDecimal.ZERO,BigDecimal::add),original=lines.stream().map(l->l.basePrice().multiply(BigDecimal.valueOf(l.quantity()))).reduce(BigDecimal.ZERO,BigDecimal::add);
  var feeRows=read(reads,"shipping:"+shopId,()->db.queryForList("SELECT fee FROM promo_shipping_policy WHERE shop_id=?",shopId));BigDecimal shipping=feeRows.isEmpty()?BigDecimal.ZERO:money(feeRows.get(0).get("fee"));
  List<Map<String,Object>> eligible=new ArrayList<>(),descriptions=new ArrayList<>();Set<String> requested=new HashSet<>();if(input!=null&&input.codes()!=null)for(String code:input.codes())if(code!=null&&!code.isBlank())requested.add(code.trim().toUpperCase(Locale.ROOT));
  for(var c:campaigns){
   if(input!=null&&input.virtualSpent()!=null)c.put("budget_reserved",money(c.get("budget_reserved")).add(input.virtualSpent().getOrDefault(number(c.get("id")),BigDecimal.ZERO)));
   if(input!=null&&input.virtualUsed()!=null)c.put("quota_reserved",number(c.get("quota_reserved"))+input.virtualUsed().getOrDefault(number(c.get("id")),0));
   String reason=input!=null&&input.excluded()!=null&&input.excluded().contains(number(c.get("id")))?"Mã đã được chọn cho đơn shop trước":!read(reads,"audience:"+c.get("id"),()->audience(user,number(c.get("id"))))?"Voucher không dành cho tài khoản này":!"LIVE".equals(phase(c))?"Chưa bắt đầu hoặc đã kết thúc":!available(c)?"Đã hết lượt hoặc ngân sách":read(reads,"used:"+c.get("id"),()->used(user,number(c.get("id"))))>=number(c.get("per_user_limit"))?"Bạn đã dùng hết lượt":subtotal.compareTo(money(c.get("min_order")))<0?"Chưa đạt đơn tối thiểu "+money(c.get("min_order")) :!allowVouchers?"Flash sale không cộng thêm voucher":"";
   var desc=new LinkedHashMap<>(c);redact(desc);desc.put("eligible",reason.isEmpty());desc.put("reason",reason);descriptions.add(desc);if(reason.isEmpty())eligible.add(c);}
  boolean auto=input==null||!Boolean.FALSE.equals(input.autoBest());
  if(!auto){for(String code:requested)require(eligible.stream().anyMatch(c->code.equals(c.get("code"))),"Mã "+code+" không đủ điều kiện hoặc không tồn tại");eligible=eligible.stream().filter(c->requested.contains(c.get("code"))).toList();require(eligible.size()<=3,"Tối đa một mã cho mỗi loại");require(eligible.stream().map(c->c.get("layer")).distinct().count()==eligible.size(),"Chỉ dùng một mã mỗi loại");}
  List<Map<String,Object>> selected=best(eligible,subtotal,shipping,auto);if(!auto)require(selected.size()==eligible.size(),"Các mã không được cộng dồn hoặc đã hết ngân sách");
  List<Applied> applied=new ArrayList<>();BigDecimal net=subtotal,shipDiscount=BigDecimal.ZERO,cut=BigDecimal.ZERO;
  for(var c:selected){BigDecimal amount=discount(c.get("discount_type").toString(),money(c.get("value")),c.get("max_discount")==null?null:money(c.get("max_discount")),"SHIPPING".equals(c.get("layer"))?shipping:net);if("SHIPPING".equals(c.get("layer")))shipDiscount=amount;else{net=net.subtract(amount);cut=cut.add(amount);}applied.add(new Applied(number(c.get("id")),c.get("code").toString(),c.get("name").toString(),c.get("layer").toString(),amount));}
  var policy=read(reads,"vat:"+shopId,()->db.queryForList("SELECT vat_percent FROM commerce_finance_policy WHERE shop_id=?",shopId));
  BigDecimal vatRate=policy.isEmpty()?BigDecimal.ZERO:new BigDecimal(policy.get(0).get("vat_percent").toString());
  BigDecimal vatIncluded=com.team.ecommerce.order.service.CommerceFinanceService.includedVat(subtotal.subtract(applied.stream().filter(a->"SHOP".equals(a.layer())).map(Applied::amount).reduce(BigDecimal.ZERO,BigDecimal::add)),vatRate);
  BigDecimal tax=BigDecimal.ZERO,fees=shipping.subtract(shipDiscount),total=net.add(fees);
  String hash=hash(user,lines,applied,shipping,tax,total);
  return new Quote(lines,original,subtotal,original.subtract(subtotal),cut,shipping,shipDiscount,fees,tax,total,applied,descriptions,hash,Instant.now().toString(),vatIncluded,vatRate);
 }
 List<Map<String,Object>> best(List<Map<String,Object>> candidates,BigDecimal subtotal,BigDecimal shipping,boolean auto){
  List<Map<String,Object>> answer=List.of();BigDecimal bestTotal=subtotal.add(shipping);
  List<Map<String,Object>> a=new ArrayList<>(),b=new ArrayList<>(),c=new ArrayList<>();a.add(null);b.add(null);c.add(null);
  for(var v:candidates){if("SHOP".equals(v.get("layer")))a.add(v);else if("PLATFORM".equals(v.get("layer")))b.add(v);else c.add(v);}
  for(var shop:a)for(var platform:b)for(var freight:c){List<Map<String,Object>> combo=new ArrayList<>();if(shop!=null)combo.add(shop);if(platform!=null)combo.add(platform);if(freight!=null)combo.add(freight);if(combo.size()>1&&combo.stream().anyMatch(v->!flag(v.get("stackable"))))continue;if(!auto&&combo.size()!=candidates.size())continue;
   BigDecimal net=subtotal,fee=shipping;boolean ok=true;for(var v:combo){BigDecimal amount=discount(v.get("discount_type").toString(),money(v.get("value")),v.get("max_discount")==null?null:money(v.get("max_discount")),"SHIPPING".equals(v.get("layer"))?fee:net);if(amount.signum()<=0||amount.compareTo(budgetLeft(v))>0){ok=false;break;}if("SHIPPING".equals(v.get("layer")))fee=fee.subtract(amount);else net=net.subtract(amount);}
   BigDecimal total=net.add(fee);if(ok&&(total.compareTo(bestTotal)<0||!auto&&combo.size()==candidates.size())){answer=combo;bestTotal=total;}
  }return answer;
 }
 private String hash(long user,List<Line> lines,List<Applied> applied,BigDecimal shipping,BigDecimal tax,BigDecimal total){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json.writeValueAsBytes(List.of(user,lines,applied,shipping,tax,total))));}catch(Exception e){throw new IllegalStateException(e);}}
 public void reserve(long user,long order,Quote quote,boolean cod){
  db.update("INSERT INTO promo_reservations(order_id,user_id,state,expires_at,pricing_snapshot) VALUES(?,?,?,IF(?,NULL,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 5 MINUTE)),?)",order,user,cod?"COMMITTED":"RESERVED",cod,encode(quote));
  TreeMap<Long,BigDecimal> costs=new TreeMap<>();Map<Long,Integer> quantities=new HashMap<>();
  for(var a:quote.applied()){costs.merge(a.id(),a.amount(),BigDecimal::add);quantities.put(a.id(),1);}
  for(var l:quote.lines())if(l.flashItemId()!=null){costs.merge(l.flashCampaignId(),l.saving(),BigDecimal::add);quantities.merge(l.flashCampaignId(),l.quantity(),Integer::sum);}
  for(var entry:costs.entrySet()){long id=entry.getKey();var c=db.queryForMap("SELECT * FROM promo_campaigns WHERE id=? FOR UPDATE",id);
   if("VOUCHER".equals(c.get("kind"))){require(audience(user,id),"Voucher không dành cho tài khoản này");require(used(user,id)<number(c.get("per_user_limit")),"Bạn đã dùng hết lượt voucher");}
   String q=cod?"quota_used":"quota_reserved",budget=cod?"budget_spent":"budget_reserved";int quantity=quantities.get(id);
   require(db.update("UPDATE promo_campaigns SET "+q+"="+q+"+?,"+budget+"="+budget+"+? WHERE id=? AND status='ACTIVE' AND starts_at<=UTC_TIMESTAMP(3) AND ends_at>UTC_TIMESTAMP(3) AND quota_used+quota_reserved+?<=quota_total AND budget_spent+budget_reserved+?<=budget_total",quantity,entry.getValue(),id,quantity,entry.getValue())==1,"Ưu đãi vừa hết lượt/ngân sách. Vui lòng tính lại đơn");
   db.update("INSERT INTO promo_redemptions(order_id,campaign_id,discount_amount) VALUES(?,?,?)",order,id,entry.getValue());
  }
  for(var a:quote.applied())db.update("INSERT IGNORE INTO promo_wallet(user_id,campaign_id) VALUES(?,?)",user,a.id());
  for(var l:quote.lines()){
   if(l.flashItemId()!=null){var item=db.queryForMap("SELECT * FROM promo_flash_items WHERE id=? FOR UPDATE",l.flashItemId());int prior=db.queryForObject("SELECT COALESCE(SUM(f.quantity),0) FROM promo_flash_reservations f JOIN promo_reservations r ON r.order_id=f.order_id WHERE f.flash_item_id=? AND r.user_id=? AND r.state<>'RELEASED'",Integer.class,l.flashItemId(),user);require(prior+l.quantity()<=number(item.get("per_user_limit")),"Bạn đã đạt giới hạn flash sale");String field=cod?"quota_used":"quota_reserved";require(db.update("UPDATE promo_flash_items SET "+field+"="+field+"+? WHERE id=? AND quota_used+quota_reserved+?<=quota_total",l.quantity(),l.flashItemId(),l.quantity())==1,"Flash sale vừa hết suất");db.update("INSERT INTO promo_flash_reservations(order_id,flash_item_id,quantity) VALUES(?,?,?)",order,l.flashItemId(),l.quantity());}
   require(db.update("UPDATE product_db.product_skus s JOIN product_db.products p ON p.id=s.product_id SET s.stock_quantity=s.stock_quantity-?,s.version=COALESCE(s.version,0)+1 WHERE s.id=? AND s.product_id=? AND s.price=? AND s.stock_quantity>=? AND s.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='ACTIVE'",l.quantity(),l.skuId(),l.productId(),l.basePrice(),l.quantity())==1,"Giá hoặc tồn kho vừa thay đổi. Vui lòng tính lại đơn");
  }
  events.enqueue("ORDER_RESERVED",Map.of("orderId",order,"userId",user,"productIds",quote.lines().stream().map(Line::productId).distinct().toList()));
 }
 public boolean release(long order){
  var records=db.queryForList("SELECT * FROM promo_reservations WHERE order_id=? FOR UPDATE",order);if(records.isEmpty())return false;String state=records.get(0).get("state").toString();if("RELEASED".equals(state))return true;
  boolean committed="COMMITTED".equals(state);var redemptions=db.queryForList("SELECT * FROM promo_redemptions WHERE order_id=? ORDER BY campaign_id",order);
  for(var d:redemptions){long id=number(d.get("campaign_id"));int units=db.queryForObject("SELECT COALESCE(SUM(f.quantity),0) FROM promo_flash_reservations f JOIN promo_flash_items i ON i.id=f.flash_item_id WHERE f.order_id=? AND i.campaign_id=?",Integer.class,order,id);if(units==0)units=1;String q=committed?"quota_used":"quota_reserved",b=committed?"budget_spent":"budget_reserved";db.update("UPDATE promo_campaigns SET "+q+"="+q+"-?,"+b+"="+b+"-? WHERE id=?",units,d.get("discount_amount"),id);}
  for(var f:db.queryForList("SELECT * FROM promo_flash_reservations WHERE order_id=? ORDER BY flash_item_id",order)){String q=committed?"quota_used":"quota_reserved";db.update("UPDATE promo_flash_items SET "+q+"="+q+"-? WHERE id=?",f.get("quantity"),f.get("flash_item_id"));}
  db.update("UPDATE product_db.product_skus s JOIN order_items i ON i.sku_id=s.id SET s.stock_quantity=s.stock_quantity+i.quantity,s.version=COALESCE(s.version,0)+1 WHERE i.order_id=?",order);
  db.update("UPDATE promo_reservations SET state='RELEASED' WHERE order_id=?",order);events.enqueue("ORDER_RELEASED",Map.of("orderId",order,"productIds",db.queryForList("SELECT DISTINCT product_id FROM order_items WHERE order_id=?",Long.class,order)));return true;
 }
 public void commit(long order){var r=db.queryForList("SELECT * FROM promo_reservations WHERE order_id=? FOR UPDATE",order);if(r.isEmpty()||"COMMITTED".equals(r.get(0).get("state")))return;require("RESERVED".equals(r.get(0).get("state")),"Lượt giữ hàng đã được hoàn");require(r.get(0).get("expires_at")==null||instant(r.get(0).get("expires_at")).isAfter(Instant.now()),"Đơn đã hết thời gian thanh toán");
  for(var d:db.queryForList("SELECT * FROM promo_redemptions WHERE order_id=? ORDER BY campaign_id",order)){int units=db.queryForObject("SELECT COALESCE(SUM(f.quantity),0) FROM promo_flash_reservations f JOIN promo_flash_items i ON i.id=f.flash_item_id WHERE f.order_id=? AND i.campaign_id=?",Integer.class,order,d.get("campaign_id"));if(units==0)units=1;db.update("UPDATE promo_campaigns SET quota_reserved=quota_reserved-?,quota_used=quota_used+?,budget_reserved=budget_reserved-?,budget_spent=budget_spent+? WHERE id=?",units,units,d.get("discount_amount"),d.get("discount_amount"),d.get("campaign_id"));}
  for(var f:db.queryForList("SELECT * FROM promo_flash_reservations WHERE order_id=? ORDER BY flash_item_id",order))db.update("UPDATE promo_flash_items SET quota_reserved=quota_reserved-?,quota_used=quota_used+? WHERE id=?",f.get("quantity"),f.get("quantity"),f.get("flash_item_id"));
  db.update("UPDATE promo_reservations SET state='COMMITTED',expires_at=NULL WHERE order_id=?",order);events.enqueue("ORDER_COMMITTED",Map.of("orderId",order));
 }
 public Map<String,Object> snapshot(long user,long order){var rows=db.queryForList("SELECT r.*,o.user_id AS buyer FROM promo_reservations r JOIN orders o ON o.id=r.order_id WHERE r.order_id=?",order);require(!rows.isEmpty(),"Đơn cũ chưa có bảng giá ưu đãi");var r=rows.get(0);boolean owner=db.queryForObject("SELECT COUNT(*) FROM order_items i JOIN product_db.products p ON p.id=i.product_id JOIN product_db.shops s ON s.id=p.shop_id WHERE i.order_id=? AND s.owner_user_id=?",Integer.class,order,user)>0;if(number(r.get("buyer"))!=user&&!owner)throw new AccessDeniedException("Đơn không thuộc tài khoản");try{var result=json.readValue(r.get("pricing_snapshot").toString(),new TypeReference<Map<String,Object>>(){});result.put("reservationState",r.get("state"));result.put("expiresAt",r.get("expires_at")==null?null:instant(r.get("expires_at")).toString());return result;}catch(Exception e){throw new IllegalStateException(e);}}
 public List<Map<String,Object>> dashboard(long user){var campaigns=catalog(user,false,true);for(var c:campaigns){var stats=db.queryForMap("SELECT COUNT(DISTINCT r.order_id) AS ordersPlaced,COALESCE(SUM(CASE WHEN o.status='DELIVERED' THEN o.total_amount ELSE 0 END),0) AS deliveredOrderRevenue,COALESCE(SUM(CASE WHEN r.state<>'RELEASED' THEN d.discount_amount ELSE 0 END),0) AS activeDiscounts,COALESCE(SUM(o.status='DELIVERED'),0) AS deliveredOrders FROM promo_redemptions d JOIN promo_reservations r ON r.order_id=d.order_id JOIN orders o ON o.id=r.order_id WHERE d.campaign_id=?",c.get("id"));c.put("metrics",stats);}return campaigns;}
 private String encode(Object value){try{return json.writeValueAsString(value);}catch(Exception e){throw new IllegalStateException(e);}}
}
