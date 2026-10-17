import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AvetmissComponent } from './avetmiss/avetmiss.component'
import { AsqaComponent} from './asqa/asqa.component'
import { StudentsPaymentsComponent } from './students-payments/students-payments.component';
import { IssuanceRegisterComponent } from './issuance-register/issuance-register.component';
import { SledReportComponent } from './sled-report/sled-report.component';
import { CertificateSummaryComponent } from './certificate-summary/certificate-summary.component';
const routes: Routes = [
  {
    path: 'avetmiss',
    component: AvetmissComponent
  },
  {
    path: 'asqa',
    component: AsqaComponent
  },
  {
    path: 'students-payments',
    component: StudentsPaymentsComponent
  },
  {
    path: 'issuance-register',
    component: IssuanceRegisterComponent
  }
  ,
  {
    path: 'sled-report',
    component: SledReportComponent
  },
  {
    path: 'certificate-summary',
    component: CertificateSummaryComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
