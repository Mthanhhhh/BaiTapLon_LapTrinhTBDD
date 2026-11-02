package com.team.ecommerce.auth.security;
import jakarta.validation.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
public class NewPasswordValidator implements ConstraintValidator<NewPassword,String> {
 private static final Set<String> COMMON=Set.of("12345678","123456789","password","password123","qwerty123","11111111","00000000");
 public boolean isValid(String value,ConstraintValidatorContext context){return value==null||!value.isBlank()&&value.codePointCount(0,value.length())>=8&&value.getBytes(StandardCharsets.UTF_8).length<=72&&!COMMON.contains(value.toLowerCase(Locale.ROOT))&&value.codePoints().noneMatch(Character::isISOControl);}
}
