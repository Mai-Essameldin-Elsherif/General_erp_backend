import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module.js';
import { AccessControlModule } from './modules/access-control/access-control.module.js';
import { OrganizationModule } from './modules/organization/organization.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { DepartmentsModule } from './modules/departments/departments.module.js';
import { BranchesModule } from './modules/branches/branches.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { WarehousesModule } from './modules/warehouses/warehouses.module.js';
import { ProcurementModule } from './modules/procurement/procurement.module.js';
import { AccountingModule } from './modules/accounting/accounting.module.js';
import { BillingModule } from './modules/billing/billing.module.js';
import { CrmModule } from './modules/crm/crm.module.js';
import { SalesModule } from './modules/sales/sales.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: String(configService.get<string>('DB_PASSWORD') || ''),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    AuthModule,
    AccessControlModule,
    OrganizationModule,
    AuditModule,
    RolesModule,
    UsersModule,
    BranchesModule,
    DepartmentsModule,
    CategoriesModule,
    ProductsModule,
    WarehousesModule,
    ProcurementModule,
    AccountingModule,
    BillingModule,
    CrmModule,
    SalesModule,
  ],
})
export class AppModule {}