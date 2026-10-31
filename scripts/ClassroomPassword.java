import java.nio.file.*;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Generates credentials for the private classroom dataset, never prints a password. */
class ClassroomPassword {
 public static void main(String[] args) throws Exception {
  Path path=Path.of(".tools/classroom-credentials.json");
  if(Files.exists(path))return;
  String password="Classroom-"+UUID.randomUUID();
  String hash=new BCryptPasswordEncoder().encode(password);
  Files.createDirectories(path.getParent());
  Files.writeString(path,"{\"password\":\""+password+"\",\"hash\":\""+hash+"\"}");
 }
}
