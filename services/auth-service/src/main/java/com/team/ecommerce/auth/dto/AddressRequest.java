package com.team.ecommerce.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddressRequest {
    @NotBlank(message = "Vui lòng nhập tên người nhận")
    private String fullName;
    @NotBlank(message = "Vui lòng nhập số điện thoại")
    private String phone;
    @NotBlank(message = "Vui lòng nhập địa chỉ nhà hoặc tên đường")
    private String street;
    @NotBlank(message = "Vui lòng nhập tỉnh hoặc thành phố")
    private String city;
    @NotBlank(message = "Vui lòng chọn phường hoặc xã")
    private String state;
    @NotBlank(message = "Vui lòng nhập quốc gia")
    private String country;
    private String zipCode;
    private Double latitude;
    private Double longitude;
    @com.fasterxml.jackson.annotation.JsonProperty("isDefault")
    private boolean isDefault;
}
