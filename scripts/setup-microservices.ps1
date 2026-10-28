# setup-microservices.ps1
$ErrorActionPreference = "Stop"

$root = "T:\ProjectTBDD"
$services = "$root\services"
$monolith = "$services\ecommerce-service"

Write-Host "Creating microservices directories..."

# 1. AUTH SERVICE
$authDir = "$services\auth-service"
New-Item -ItemType Directory -Force -Path "$authDir\src\main\java\com\team\ecommerce\auth" | Out-Null
New-Item -ItemType Directory -Force -Path "$authDir\src\main\java\com\team\ecommerce\shared" | Out-Null
New-Item -ItemType Directory -Force -Path "$authDir\src\main\resources" | Out-Null

Copy-Item -Recurse -Force "$monolith\src\main\java\com\team\ecommerce\auth\*" "$authDir\src\main\java\com\team\ecommerce\auth\"
Copy-Item -Recurse -Force "$monolith\src\main\java\com\team\ecommerce\shared\*" "$authDir\src\main\java\com\team\ecommerce\shared\"
Remove-Item -Force "$authDir\src\main\java\com\team\ecommerce\auth\config\AuthDataSourceConfig.java" -ErrorAction SilentlyContinue

# 2. PRODUCT SERVICE
$prodDir = "$services\product-service"
New-Item -ItemType Directory -Force -Path "$prodDir\src\main\java\com\team\ecommerce\product" | Out-Null
New-Item -ItemType Directory -Force -Path "$prodDir\src\main\java\com\team\ecommerce\shared" | Out-Null
New-Item -ItemType Directory -Force -Path "$prodDir\src\main\java\com\team\ecommerce\auth\security" | Out-Null
New-Item -ItemType Directory -Force -Path "$prodDir\src\main\resources" | Out-Null

Copy-Item -Recurse -Force "$monolith\src\main\java\com\team\ecommerce\product\*" "$prodDir\src\main\java\com\team\ecommerce\product\"
Copy-Item -Recurse -Force "$monolith\src\main\java\com\team\ecommerce\shared\*" "$prodDir\src\main\java\com\team\ecommerce\shared\"
Copy-Item -Recurse -Force "$monolith\src\main\java\com\team\ecommerce\auth\security\*" "$prodDir\src\main\java\com\team\ecommerce\auth\security\"
Remove-Item -Force "$prodDir\src\main\java\com\team\ecommerce\product\config\ProductDataSourceConfig.java" -ErrorAction SilentlyContinue

# 3. ORDER SERVICE
$orderDir = "$services\order-service"
New-Item -ItemType Directory -Force -Path "$orderDir\src\main\java\com\team\ecommerce\order" | Out-Null
New-Item -ItemType Directory -Force -Path "$orderDir\src\main\java\com\team\ecommerce\shared" | Out-Null
New-Item -ItemType Directory -Force -Path "$orderDir\src\main\java\com\team\ecommerce\auth\internal" | Out-Null
New-Item -ItemType Directory -Force -Path "$orderDir\src\main\java\com\team\ecommerce\auth\security" | Out-Null
New-Item -ItemType Directory -Force -Path "$orderDir\src\main\java\com\team\ecommerce\product\internal" | Out-Null
New-Item -ItemType Directory -Force -Path "$orderDir\src\main\resources" | Out-Null

Copy-Item -Recurse -Force "$monolith\src\main\java\com\team\ecommerce\order\*" "$orderDir\src\main\java\com\team\ecommerce\order\"
Copy-Item -Recurse -Force "$monolith\src\main\java\com\team\ecommerce\shared\*" "$orderDir\src\main\java\com\team\ecommerce\shared\"
Copy-Item -Force "$monolith\src\main\java\com\team\ecommerce\auth\internal\AddressInternalDTO.java" "$orderDir\src\main\java\com\team\ecommerce\auth\internal\"
Copy-Item -Recurse -Force "$monolith\src\main\java\com\team\ecommerce\auth\security\*" "$orderDir\src\main\java\com\team\ecommerce\auth\security\"
Copy-Item -Force "$monolith\src\main\java\com\team\ecommerce\product\internal\ProductInternalDTO.java" "$orderDir\src\main\java\com\team\ecommerce\product\internal\"
Copy-Item -Force "$monolith\src\main\java\com\team\ecommerce\product\internal\VariantInternalDTO.java" "$orderDir\src\main\java\com\team\ecommerce\product\internal\"
Remove-Item -Force "$orderDir\src\main\java\com\team\ecommerce\order\config\OrderDataSourceConfig.java" -ErrorAction SilentlyContinue

# 4. PAYMENT SERVICE
$payDir = "$services\payment-service"
New-Item -ItemType Directory -Force -Path "$payDir\src\main\java\com\team\ecommerce\payment" | Out-Null
New-Item -ItemType Directory -Force -Path "$payDir\src\main\java\com\team\ecommerce\shared" | Out-Null
New-Item -ItemType Directory -Force -Path "$payDir\src\main\java\com\team\ecommerce\order\dto" | Out-Null
New-Item -ItemType Directory -Force -Path "$payDir\src\main\java\com\team\ecommerce\order\entity" | Out-Null
New-Item -ItemType Directory -Force -Path "$payDir\src\main\java\com\team\ecommerce\auth\security" | Out-Null
New-Item -ItemType Directory -Force -Path "$payDir\src\main\resources" | Out-Null

Copy-Item -Recurse -Force "$monolith\src\main\java\com\team\ecommerce\payment\*" "$payDir\src\main\java\com\team\ecommerce\payment\"
Copy-Item -Recurse -Force "$monolith\src\main\java\com\team\ecommerce\shared\*" "$payDir\src\main\java\com\team\ecommerce\shared\"
Copy-Item -Force "$monolith\src\main\java\com\team\ecommerce\order\dto\OrderResponse.java" "$payDir\src\main\java\com\team\ecommerce\order\dto\"
Copy-Item -Force "$monolith\src\main\java\com\team\ecommerce\order\dto\OrderItemResponse.java" "$payDir\src\main\java\com\team\ecommerce\order\dto\"
Copy-Item -Force "$monolith\src\main\java\com\team\ecommerce\order\entity\OrderStatus.java" "$payDir\src\main\java\com\team\ecommerce\order\entity\"
Copy-Item -Recurse -Force "$monolith\src\main\java\com\team\ecommerce\auth\security\*" "$payDir\src\main\java\com\team\ecommerce\auth\security\"
Remove-Item -Force "$payDir\src\main\java\com\team\ecommerce\payment\config\PaymentDataSourceConfig.java" -ErrorAction SilentlyContinue

Write-Host "Scaffolding completed successfully!"

