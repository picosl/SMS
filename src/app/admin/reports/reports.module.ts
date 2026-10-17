import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReportsRoutingModule } from './reports-routing.module'
import { AvetmissComponent } from './avetmiss/avetmiss.component'
import { AsqaComponent} from './asqa/asqa.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatRadioModule } from '@angular/material/radio';
import { StudentsPaymentsComponent } from './students-payments/students-payments.component';
import { IssuanceRegisterComponent } from './issuance-register/issuance-register.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SledReportComponent } from './sled-report/sled-report.component';
import { VerifyAvetmissComponent } from './verify-avetmiss/verify-avetmiss.component'
import { CertificateSummaryComponent } from './certificate-summary/certificate-summary.component'
@NgModule({
  declarations: [
    AvetmissComponent,
    AsqaComponent,
    StudentsPaymentsComponent,
    IssuanceRegisterComponent,
    SledReportComponent,
    VerifyAvetmissComponent,
    CertificateSummaryComponent
  ],
  imports: [
    CommonModule,
    ReportsRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatRadioModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ]
})
export class ReportsModule { }
