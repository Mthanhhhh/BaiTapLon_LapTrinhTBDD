package com.team.ecommerce.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.ecommerce.auth.dto.AddressRequest;
import com.team.ecommerce.shared.exception.BadRequestException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/** Administrative snapshot: provinces.open-api.vn/api/v2/?depth=2 (2026-11-01). */
@Component
public class AddressRegions {
    private final JsonNode regions;
    public AddressRegions(ObjectMapper mapper) throws java.io.IOException {
        try (var input = new ClassPathResource("vietnam-regions-v2.json").getInputStream()) {
            regions = mapper.readTree(input);
        }
    }
    public void validate(AddressRequest request) {
        if (request.getLatitude() == null ^ request.getLongitude() == null)
            throw new BadRequestException("Vui lòng cung cấp đủ tọa độ ghim.");
        if (request.getLatitude() != null && (!Double.isFinite(request.getLatitude()) || !Double.isFinite(request.getLongitude())
                || Math.abs(request.getLatitude()) > 90 || Math.abs(request.getLongitude()) > 180))
            throw new BadRequestException("Tọa độ không hợp lệ.");
        boolean found = false;
        for (JsonNode province : regions) if (province.path("name").asText().equals(request.getCity()))
            for (JsonNode ward : province.path("wards"))
                if (ward.path("name").asText().equals(request.getState())) found = true;
        if (!found) throw new BadRequestException("Vui lòng chọn tỉnh/thành phố và phường/xã tương ứng trong danh sách mới.");
    }
}
