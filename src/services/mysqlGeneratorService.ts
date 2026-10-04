import { ProductItem, Customer, CustomerOrder, Supplier, DailySale, AppUser } from '../types';

export class MySQLGeneratorService {
  /**
   * Generates a complete MySQL database script (.sql) ready to load into Cloud SQL, AWS RDS or local MySQL.
   */
  static generateMySQLDump(
    products: ProductItem[],
    suppliers: Supplier[],
    customers: Customer[],
    orders: CustomerOrder[],
    dailySales: DailySale[],
    users: AppUser[]
  ): string {
    const timestamp = new Date().toISOString();

    let sql = `-- ============================================================
-- SUBLISTOCK PRO - BASE DE DATOS MYSQL PARA SPRING BOOT & APP MÓVIL
-- Fecha de Generación: ${timestamp}
-- Compatible con: MySQL 8.0+, MariaDB 10.5+, Google Cloud SQL, AWS RDS
-- ============================================================

CREATE DATABASE IF NOT EXISTS \`sublistock_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`sublistock_db\`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;

DROP TABLE IF EXISTS \`daily_sale_items\`;
DROP TABLE IF EXISTS \`daily_sales\`;
DROP TABLE IF EXISTS \`order_items\`;
DROP TABLE IF EXISTS \`customer_orders\`;
DROP TABLE IF EXISTS \`products\`;
DROP TABLE IF EXISTS \`suppliers\`;
DROP TABLE IF EXISTS \`customers\`;
DROP TABLE IF EXISTS \`users\`;

-- ------------------------------------------------------------
-- 1. Tabla de Usuarios y Roles (Spring Security / App Móvil)
-- ------------------------------------------------------------
CREATE TABLE \`users\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(120) NOT NULL,
  \`email\` VARCHAR(150) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) DEFAULT '$2a$10$e7q8kL8M...demoHash',
  \`role\` ENUM('admin', 'disenador', 'operador', 'vendedor') NOT NULL DEFAULT 'vendedor',
  \`avatar_url\` TEXT,
  \`active\` BOOLEAN NOT NULL DEFAULT TRUE,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. Tabla de Proveedores de Insumos
-- ------------------------------------------------------------
CREATE TABLE \`suppliers\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(150) NOT NULL,
  \`contact_person\` VARCHAR(120),
  \`phone\` VARCHAR(50),
  \`email\` VARCHAR(150),
  \`address\` TEXT,
  \`cuit_rut\` VARCHAR(50),
  \`lead_time_days\` INT DEFAULT 3,
  \`rating\` INT DEFAULT 5,
  \`notes\` TEXT,
  \`created_at\` DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. Tabla de Productos e Insumos de Sublimación
-- ------------------------------------------------------------
CREATE TABLE \`products\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`sku\` VARCHAR(60) NOT NULL UNIQUE,
  \`name\` VARCHAR(200) NOT NULL,
  \`category\` VARCHAR(50) NOT NULL,
  \`material\` VARCHAR(60) NOT NULL,
  \`size\` VARCHAR(50),
  \`color\` VARCHAR(60),
  \`unit\` VARCHAR(40) DEFAULT 'Unidades',
  \`current_stock\` INT NOT NULL DEFAULT 0,
  \`min_stock\` INT NOT NULL DEFAULT 10,
  \`cost_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`sale_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`sale_price_customized\` DECIMAL(12,2),
  \`supplier_id\` VARCHAR(64),
  \`location\` VARCHAR(100),
  \`description\` TEXT,
  \`last_restocked\` DATE,
  INDEX \`idx_prod_category\` (\`category\`),
  INDEX \`idx_prod_stock\` (\`current_stock\`, \`min_stock\`),
  FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. Tabla de Clientes
-- ------------------------------------------------------------
CREATE TABLE \`customers\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(150) NOT NULL,
  \`business_or_contact\` VARCHAR(150),
  \`phone\` VARCHAR(50),
  \`email\` VARCHAR(150),
  \`address\` TEXT,
  \`total_orders_count\` INT DEFAULT 0,
  \`total_spent\` DECIMAL(14,2) DEFAULT 0.00,
  \`current_balance\` DECIMAL(12,2) DEFAULT 0.00,
  \`notes\` TEXT,
  \`created_at\` DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. Tabla de Pedidos de Producción (Con Google Calendar y Estados)
-- ------------------------------------------------------------
CREATE TABLE \`customer_orders\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`order_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`customer_id\` VARCHAR(64) NOT NULL,
  \`customer_name\` VARCHAR(150) NOT NULL,
  \`customer_phone\` VARCHAR(50),
  \`created_at\` DATETIME NOT NULL,
  \`delivery_date\` DATE NOT NULL,
  \`delivery_time\` VARCHAR(10),
  \`production_status\` ENUM('diseno_pendiente','en_produccion','control_calidad','listo_entrega','entregado','cancelado') NOT NULL DEFAULT 'diseno_pendiente',
  \`payment_status\` ENUM('pendiente','seña','pagado') NOT NULL DEFAULT 'pendiente',
  \`deposit_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`total_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`cost_total\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`remaining_balance\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`google_calendar_event_id\` VARCHAR(150),
  \`google_calendar_event_url\` TEXT,
  \`notes\` TEXT,
  \`delivered_at\` DATETIME,
  INDEX \`idx_order_delivery\` (\`delivery_date\`),
  INDEX \`idx_order_status\` (\`production_status\`),
  FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 6. Tabla de Ítems del Pedido (Con Imagen de Diseño y Modo Lisa/Estampada)
-- ------------------------------------------------------------
CREATE TABLE \`order_items\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`order_id\` VARCHAR(64) NOT NULL,
  \`product_id\` VARCHAR(64) NOT NULL,
  \`product_name\` VARCHAR(200) NOT NULL,
  \`category\` VARCHAR(50),
  \`material\` VARCHAR(60),
  \`size\` VARCHAR(50),
  \`color\` VARCHAR(60),
  \`quantity\` INT NOT NULL DEFAULT 1,
  \`unit_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`unit_cost\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`total_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`sale_mode\` ENUM('lisa', 'estampada') NOT NULL DEFAULT 'estampada',
  \`design_image_url\` LONGTEXT,
  \`design_name\` VARCHAR(150),
  \`customization_details\` TEXT,
  FOREIGN KEY (\`order_id\`) REFERENCES \`customer_orders\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 7. Tabla de Ventas Diarias de Mostrador
-- ------------------------------------------------------------
CREATE TABLE \`daily_sales\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`sale_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`date\` DATETIME NOT NULL,
  \`customer_name\` VARCHAR(150) NOT NULL,
  \`payment_method\` ENUM('efectivo','transferencia','tarjeta','mercadopago') NOT NULL,
  \`total_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`total_cost\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`notes\` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 8. Tabla de Ítems de Ventas Diarias
-- ------------------------------------------------------------
CREATE TABLE \`daily_sale_items\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sale_id\` VARCHAR(64) NOT NULL,
  \`product_id\` VARCHAR(64) NOT NULL,
  \`product_name\` VARCHAR(200) NOT NULL,
  \`quantity\` INT NOT NULL DEFAULT 1,
  \`unit_price\` DECIMAL(12,2) NOT NULL,
  \`unit_cost\` DECIMAL(12,2) NOT NULL,
  \`total_price\` DECIMAL(12,2) NOT NULL,
  \`sale_mode\` ENUM('lisa', 'estampada') DEFAULT 'lisa',
  FOREIGN KEY (\`sale_id\`) REFERENCES \`daily_sales\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- INSERCIÓN DE DATOS ACTUALES (SEEDING)
-- ============================================================

`;

    // Reconcile Suppliers: Ensure every supplierId referenced by products exists in suppliers table
    const allSuppliers = [...suppliers];
    const supplierIds = new Set(allSuppliers.map(s => s.id));
    products.forEach(p => {
      if (p.supplierId && !supplierIds.has(p.supplierId)) {
        allSuppliers.push({
          id: p.supplierId,
          name: `Proveedor Insumos (${p.supplierId})`,
          contactPerson: 'Contacto Taller',
          phone: '',
          email: '',
          address: '',
          cuitRut: '',
          leadTimeDays: 3,
          rating: 5,
          notes: 'Registrado automáticamente para integridad referencial de insumos'
        } as Supplier);
        supplierIds.add(p.supplierId);
      }
    });

    // Reconcile Customers: Ensure every customerId referenced by orders exists in customers table
    const allCustomers = [...customers];
    const customerIds = new Set(allCustomers.map(c => c.id));
    orders.forEach(o => {
      if (o.customerId && !customerIds.has(o.customerId)) {
        allCustomers.push({
          id: o.customerId,
          name: o.customerName || `Cliente (${o.customerId})`,
          businessOrContact: '',
          phone: o.customerPhone || '',
          email: '',
          address: '',
          totalOrdersCount: 1,
          totalSpent: o.totalAmount || 0,
          currentBalance: o.remainingBalance || 0,
          notes: 'Registrado automáticamente para integridad referencial de órdenes'
        } as Customer);
        customerIds.add(o.customerId);
      }
    });

    // 1. Users
    if (users.length > 0) {
      sql += `-- Inserción de Usuarios y Roles\n`;
      sql += `INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`role\`, \`active\`, \`created_at\`) VALUES\n`;
      const uValues = users.map(u => 
        `('${escapeSql(u.id)}', '${escapeSql(u.name)}', '${escapeSql(u.email)}', '${u.role}', ${u.active ? 1 : 0}, '${escapeSql(u.createdAt || new Date().toISOString())}')`
      ).join(',\n');
      sql += uValues + ';\n\n';
    }

    // 2. Suppliers
    if (allSuppliers.length > 0) {
      sql += `-- Inserción de Proveedores\n`;
      sql += `INSERT INTO \`suppliers\` (\`id\`, \`name\`, \`contact_person\`, \`phone\`, \`email\`, \`lead_time_days\`, \`rating\`, \`notes\`) VALUES\n`;
      const sValues = allSuppliers.map(s => 
        `('${escapeSql(s.id)}', '${escapeSql(s.name)}', '${escapeSql(s.contactPerson || '')}', '${escapeSql(s.phone || '')}', '${escapeSql(s.email || '')}', ${s.leadTimeDays || 3}, ${s.rating || 5}, '${escapeSql(s.notes || '')}')`
      ).join(',\n');
      sql += sValues + ';\n\n';
    }

    // 3. Products (Safe supplier_id mapping)
    if (products.length > 0) {
      sql += `-- Inserción de Insumos y Productos\n`;
      sql += `INSERT INTO \`products\` (\`id\`, \`sku\`, \`name\`, \`category\`, \`material\`, \`size\`, \`color\`, \`unit\`, \`current_stock\`, \`min_stock\`, \`cost_price\`, \`sale_price\`, \`supplier_id\`, \`location\`) VALUES\n`;
      const pValues = products.map(p => {
        const validSup = p.supplierId && supplierIds.has(p.supplierId) ? `'${escapeSql(p.supplierId)}'` : 'NULL';
        return `('${escapeSql(p.id)}', '${escapeSql(p.sku)}', '${escapeSql(p.name)}', '${escapeSql(p.category)}', '${escapeSql(p.material)}', ${p.size ? `'${escapeSql(p.size)}'` : 'NULL'}, ${p.color ? `'${escapeSql(p.color)}'` : 'NULL'}, '${escapeSql(p.unit)}', ${p.currentStock}, ${p.minStock}, ${p.costPrice}, ${p.salePrice}, ${validSup}, '${escapeSql(p.location || 'Taller')}')`;
      }).join(',\n');
      sql += pValues + ';\n\n';
    }

    // 4. Customers
    if (allCustomers.length > 0) {
      sql += `-- Inserción de Clientes\n`;
      sql += `INSERT INTO \`customers\` (\`id\`, \`name\`, \`business_or_contact\`, \`phone\`, \`email\`, \`total_orders_count\`, \`total_spent\`, \`current_balance\`) VALUES\n`;
      const cValues = allCustomers.map(c => 
        `('${escapeSql(c.id)}', '${escapeSql(c.name)}', '${escapeSql(c.businessOrContact || '')}', '${escapeSql(c.phone || '')}', '${escapeSql(c.email || '')}', ${c.totalOrdersCount || 0}, ${c.totalSpent || 0}, ${c.currentBalance || 0})`
      ).join(',\n');
      sql += cValues + ';\n\n';
    }

    // 5. Orders
    if (orders.length > 0) {
      sql += `-- Inserción de Pedidos de Producción\n`;
      sql += `INSERT INTO \`customer_orders\` (\`id\`, \`order_number\`, \`customer_id\`, \`customer_name\`, \`customer_phone\`, \`created_at\`, \`delivery_date\`, \`delivery_time\`, \`production_status\`, \`payment_status\`, \`deposit_amount\`, \`total_amount\`, \`cost_total\`, \`remaining_balance\`) VALUES\n`;
      const oValues = orders.map(o => {
        const validCustId = o.customerId && customerIds.has(o.customerId) ? o.customerId : allCustomers[0]?.id;
        return `('${escapeSql(o.id)}', '${escapeSql(o.orderNumber)}', '${escapeSql(validCustId)}', '${escapeSql(o.customerName)}', '${escapeSql(o.customerPhone || '')}', '${escapeSql((o.createdAt || new Date().toISOString()).replace('T', ' ').slice(0, 19))}', '${escapeSql(o.deliveryDate)}', '${escapeSql(o.deliveryTime || '17:00')}', '${o.productionStatus}', '${o.paymentStatus}', ${o.depositAmount || 0}, ${o.totalAmount || 0}, ${o.costTotal || 0}, ${o.remainingBalance || 0})`;
      }).join(',\n');
      sql += oValues + ';\n\n';

      // 6. Order Items
      const productIds = new Set(products.map(p => p.id));
      const allItems: Array<{ orderId: string; item: any }> = [];
      orders.forEach(o => {
        (o.items || []).forEach(i => {
          if (productIds.has(i.productId)) {
            allItems.push({ orderId: o.id, item: i });
          }
        });
      });

      if (allItems.length > 0) {
        sql += `-- Inserción de Ítems de Pedidos (con modo Lisa/Estampada y Diseños)\n`;
        sql += `INSERT INTO \`order_items\` (\`order_id\`, \`product_id\`, \`product_name\`, \`quantity\`, \`unit_price\`, \`unit_cost\`, \`total_price\`, \`sale_mode\`, \`customization_details\`) VALUES\n`;
        const itemValues = allItems.map(({ orderId, item }) => 
          `('${escapeSql(orderId)}', '${escapeSql(item.productId)}', '${escapeSql(item.productName)}', ${item.quantity}, ${item.unitPrice}, ${item.unitCost || 0}, ${item.totalPrice}, '${item.saleMode || 'estampada'}', '${escapeSql(item.customizationDetails || '')}')`
        ).join(',\n');
        sql += itemValues + ';\n\n';
      }
    }

    // 7. Daily Sales
    if (dailySales.length > 0) {
      sql += `-- Inserción de Ventas Diarias de Mostrador\n`;
      sql += `INSERT INTO \`daily_sales\` (\`id\`, \`sale_number\`, \`date\`, \`customer_name\`, \`payment_method\`, \`total_amount\`, \`total_cost\`, \`notes\`) VALUES\n`;
      const dsValues = dailySales.map(s => 
        `('${escapeSql(s.id)}', '${escapeSql(s.saleNumber)}', '${escapeSql(s.date.replace('T', ' ').slice(0, 19))}', '${escapeSql(s.customerName)}', '${s.paymentMethod}', ${s.totalAmount}, ${s.totalCost}, '${escapeSql(s.notes || '')}')`
      ).join(',\n');
      sql += dsValues + ';\n\n';
    }

    sql += `-- ------------------------------------------------------------\n`;
    sql += `-- Commit de transacciones y reactivación de foreign keys\n`;
    sql += `-- ------------------------------------------------------------\n`;
    sql += `COMMIT;\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;
    sql += `-- Fin del script MySQL. Importado con éxito en MySQL local / Cloud SQL / AWS RDS.\n`;
    return sql;
  }

  /**
   * Generates complete Java Spring Boot 3 + MySQL code samples ready for Android/iOS mobile API.
   */
  static generateSpringBootCodeGuide(): {
    pomXml: string;
    applicationYml: string;
    mobileApiControllerJava: string;
    customerOrderEntityJava: string;
  } {
    const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.3</version>
        <relativePath/>
    </parent>
    <groupId>com.sublistock</groupId>
    <artifactId>sublistock-backend-api</artifactId>
    <version>1.0.0</version>
    <name>SubliStock Pro Backend API</name>
    <description>REST API en Spring Boot y MySQL para SubliStock Web & Mobile App</description>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- MySQL Driver -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- JWT for Mobile App Authentication -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.6</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>

        <!-- OpenAPI / Swagger for Mobile App Dev -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.6.0</version>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>`;

    const applicationYml = `server:
  port: 8080

spring:
  application:
    name: sublistock-backend-api
  datasource:
    # URL de conexión Cloud SQL, AWS RDS o MySQL local:
    url: jdbc:mysql://\${MYSQL_HOST:localhost}:3306/sublistock_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: \${MYSQL_USER:root}
    password: \${MYSQL_PASSWORD:sublipass2026}
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQLDialect

# Seguridad y Token JWT para la App Móvil:
jwt:
  secret: \${JWT_SECRET:SubliStockProSuperSecureKeyWithEnoughEntropy2026!}
  expiration-ms: 86400000 # 24 horas`;

    const mobileApiControllerJava = `package com.sublistock.controller;

import com.sublistock.model.*;
import com.sublistock.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@RestController
@RequestMapping("/api/v1/mobile")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MobileApiController {

    private final ProductRepository productRepository;
    private final CustomerOrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    // 1. Endpoint para App Móvil: Dashboard con KPIs y alertas
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getMobileDashboard() {
        Map<String, Object> response = new HashMap<>();
        List<Product> criticalStock = productRepository.findByCurrentStockLessThanEqualMinStock();
        List<CustomerOrder> urgentOrders = orderRepository.findUrgentActiveOrders();

        response.put("criticalStockCount", criticalStock.size());
        response.put("criticalProducts", criticalStock);
        response.put("urgentOrdersCount", urgentOrders.size());
        response.put("urgentOrders", urgentOrders);
        return ResponseEntity.ok(response);
    }

    // 2. Endpoint para App Móvil: Cargar imagen de diseño a un ítem de remera
    @PostMapping("/orders/{orderId}/items/{itemId}/upload-design")
    public ResponseEntity<Map<String, String>> uploadItemDesign(
            @PathVariable String orderId,
            @PathVariable Long itemId,
            @RequestParam("file") MultipartFile file) {
        
        // Aquí se puede guardar en Google Cloud Storage / AWS S3
        // o almacenar la URL/Base64 en la base de datos MySQL
        String fileUrl = "https://storage.googleapis.com/sublistock-designs/" + file.getOriginalFilename();
        return ResponseEntity.ok(Map.of("designImageUrl", fileUrl, "status", "SUCCESS"));
    }

    // 3. Endpoint para App Móvil: Cambiar estado de producción desde el taller
    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<CustomerOrder> updateOrderStatus(
            @PathVariable String orderId,
            @RequestParam ProductionStatus newStatus) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        order.setProductionStatus(newStatus);
        return ResponseEntity.ok(orderRepository.save(order));
    }
}`;

    const customerOrderEntityJava = `package com.sublistock.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "customer_orders")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CustomerOrder {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "order_number", unique = true, nullable = false, length = 50)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @Column(name = "delivery_time")
    private String deliveryTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "production_status", nullable = false)
    private ProductionStatus productionStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus;

    @Column(name = "deposit_amount", precision = 12, scale = 2)
    private BigDecimal depositAmount;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "remaining_balance", precision = 12, scale = 2)
    private BigDecimal remainingBalance;

    @Column(name = "google_calendar_event_id")
    private String googleCalendarEventId;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items;
}`;

    return {
      pomXml,
      applicationYml,
      mobileApiControllerJava,
      customerOrderEntityJava
    };
  }

  static generateFullMySQLScript(
    products: ProductItem[],
    suppliers: Supplier[],
    customers: Customer[],
    orders: CustomerOrder[],
    dailySales: DailySale[],
    users: AppUser[]
  ): string {
    return this.generateMySQLDump(products, suppliers, customers, orders, dailySales, users);
  }

  static getSpringBootStructure(): Record<string, string> {
    const artifacts = this.generateSpringBootCodeGuide();
    return {
      'pom.xml': artifacts.pomXml,
      'application.properties': artifacts.applicationYml,
      'ProductController.java': artifacts.mobileApiControllerJava,
      'CustomerOrder.java': artifacts.customerOrderEntityJava
    };
  }
}


function escapeSql(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}
