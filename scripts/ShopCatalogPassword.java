import java.nio.file.*;
import java.security.SecureRandom;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
/** Local credentials for the classroom's role-play merchant accounts. */
class ShopCatalogPassword {
 public static void main(String[] args)throws Exception{
  Path target=Path.of(".tools/shop-catalog-credentials.json");if(Files.exists(target))return;
  String password="ShopDemo@"+(1000+new SecureRandom().nextInt(9000))+"!";
  String hash=new BCryptPasswordEncoder().encode(password);
  Files.createDirectories(target.getParent());Files.writeString(target,"{\"loginPattern\":\"shop.<brand>@eshop.example\",\"password\":\""+password+"\",\"hash\":\""+hash+"\"}");
 }
}
