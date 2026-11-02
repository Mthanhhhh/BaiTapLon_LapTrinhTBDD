package com.team.ecommerce.auth.security;
import com.team.ecommerce.auth.dto.*;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import static org.junit.jupiter.api.Assertions.*;
class LegacyPasswordPolicyTest {
 @Test void existingShortPasswordsStillMatchOriginalBcryptHash(){var encoder=new BCryptPasswordEncoder();String stored=encoder.encode("old6!x");assertTrue(encoder.matches("old6!x",stored));assertFalse(encoder.matches("wrong",stored));}
 @Test void loginDoesNotApplyNewAccountPasswordMinimum(){try(var factory=Validation.buildDefaultValidatorFactory()){var request=new LoginRequest();request.setEmail("legacy@eshop.example");request.setPassword("old6!x");assertTrue(factory.getValidator().validate(request).isEmpty());}}
 @Test void newRegistrationRequiresEightCharacters(){try(var factory=Validation.buildDefaultValidatorFactory()){var request=new RegisterRequest();request.setEmail("new@eshop.example");request.setFullName("New user");request.setPassword("old6!x");assertFalse(factory.getValidator().validate(request).isEmpty());request.setPassword("NewPass8!");assertTrue(factory.getValidator().validate(request).isEmpty());}}
}
