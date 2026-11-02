package com.team.ecommerce.auth.security;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;
@Target({ElementType.FIELD,ElementType.PARAMETER}) @Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy=NewPasswordValidator.class)
public @interface NewPassword {
 String message() default "Mật khẩu mới cần ít nhất 8 ký tự, tối đa 72 byte UTF-8 và không quá phổ biến";
 Class<?>[] groups() default {};
 Class<? extends Payload>[] payload() default {};
}
