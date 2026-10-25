package com.team.ecommerce.auth.internal;

import com.team.ecommerce.auth.entity.Address;
import com.team.ecommerce.auth.repository.AddressRepository;
import com.team.ecommerce.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthInternalService {
    
    private final AddressRepository addressRepository;

    @Transactional(value = "authTransactionManager", readOnly = true)
    public AddressInternalDTO getAddressByIdAndUserId(Long addressId, Long userId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));
                
        return AddressInternalDTO.builder()
                .id(address.getId())
                .fullName(address.getFullName())
                .phone(address.getPhone())
                .street(address.getStreet())
                .city(address.getCity())
                .country(address.getCountry())
                .build();
    }
}
