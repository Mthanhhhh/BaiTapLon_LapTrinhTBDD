package com.team.ecommerce.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.ecommerce.auth.dto.AddressRequest;
import com.team.ecommerce.auth.dto.AddressResponse;
import com.team.ecommerce.auth.service.AddressRegions;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AddressContractTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test void defaultFlagUsesTheSameNameAsMobile() throws Exception {
        var request = mapper.readValue("{\"isDefault\":true}", AddressRequest.class);
        assertTrue(request.isDefault());
        var response = mapper.valueToTree(AddressResponse.builder().isDefault(true).build());
        assertTrue(response.path("isDefault").asBoolean());
        assertFalse(response.has("default"));
    }

    @Test void wardMustBelongToProvinceAndPinNeedsBothCoordinates() throws Exception {
        var regions = new AddressRegions(mapper);
        var request = new AddressRequest();
        request.setCity("Thành phố Hồ Chí Minh");
        request.setState("Phường Sài Gòn");
        assertDoesNotThrow(() -> regions.validate(request));
        request.setCity("Thành phố Hà Nội");
        assertThrows(RuntimeException.class, () -> regions.validate(request));
        request.setCity("Thành phố Hồ Chí Minh");
        request.setLatitude(10.775);
        assertThrows(RuntimeException.class, () -> regions.validate(request));
        request.setLongitude(106.703);
        assertDoesNotThrow(() -> regions.validate(request));
    }
}
