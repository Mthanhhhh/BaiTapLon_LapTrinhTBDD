package com.team.ecommerce.auth.service;

import com.team.ecommerce.auth.dto.AddressRequest;
import com.team.ecommerce.auth.dto.AddressResponse;
import com.team.ecommerce.auth.entity.Address;
import com.team.ecommerce.auth.entity.User;
import com.team.ecommerce.auth.repository.AddressRepository;
import com.team.ecommerce.auth.repository.UserRepository;
import com.team.ecommerce.shared.exception.BadRequestException;
import com.team.ecommerce.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public List<AddressResponse> getAddresses(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDesc(userId).stream()
                .map(AddressResponse::from)
                .collect(Collectors.toList());
    }

    public AddressResponse addAddress(Long userId, AddressRequest request) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.isDefault()) {
            addressRepository.updateIsDefaultByUserId(userId);
        }

        Address address = Address.builder()
                .user(user)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .street(request.getStreet())
                .city(request.getCity())
                .state(request.getState())
                .country(toCountryCode(request.getCountry()))
                .zipCode(request.getZipCode())
                .isDefault(request.isDefault())
                .build();

        address = addressRepository.save(address);
        return AddressResponse.from(address);
    }

    public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));

        if (request.isDefault() && !address.isDefault()) {
            addressRepository.updateIsDefaultByUserId(userId);
        }

        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setStreet(request.getStreet());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setCountry(toCountryCode(request.getCountry()));
        address.setZipCode(request.getZipCode());
        address.setDefault(request.isDefault());

        address = addressRepository.save(address);
        return AddressResponse.from(address);
    }

    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));
        addressRepository.delete(address);
    }

    public AddressResponse setDefaultAddress(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));

        addressRepository.updateIsDefaultByUserId(userId);
        address.setDefault(true);
        
        address = addressRepository.save(address);
        return AddressResponse.from(address);
    }

    private String toCountryCode(String country) {
        String normalized = country == null ? "" : country.trim();
        if (normalized.equalsIgnoreCase("Việt Nam") || normalized.equalsIgnoreCase("Vietnam") || normalized.equalsIgnoreCase("VN")) {
            return "VN";
        }
        if (normalized.equalsIgnoreCase("United States") || normalized.equalsIgnoreCase("USA") || normalized.equalsIgnoreCase("US")) {
            return "US";
        }
        if (normalized.matches("(?i)[a-z]{2}")) {
            return normalized.toUpperCase();
        }
        throw new BadRequestException("Quốc gia chưa được hỗ trợ. Hãy nhập Việt Nam hoặc mã quốc gia gồm 2 ký tự.");
    }
}
