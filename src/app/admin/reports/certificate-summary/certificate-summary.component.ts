import { DatePipe } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ApiService } from 'src/app/api/api.service'
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS, } from '@angular/material-moment-adapter'
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core'

@Component({
  selector: 'app-certificate-summary',
  templateUrl: './certificate-summary.component.html',
  styleUrls: ['./certificate-summary.component.sass'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-gb' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
    DatePipe
  ],
})
export class CertificateSummaryComponent implements OnInit {
  HFormGroup1: FormGroup
  dateValidate1 = { isError: false, errorMessage: '' }
  downloadFile
  baseApi
  allCourses
  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private datePipe: DatePipe
  ) {
    this.getCourses()
  }
  ngOnInit(): void {
    this.HFormGroup1 = this.fb.group({
      certificateIssueDateFrom: ['', [Validators.required]],
      certificateIssueDateTo: ['', [Validators.required]],
      courseId: ['all', [Validators.required]],
    })
  }
  getCourses() {
    this.apiService.getAPI('getcourse').subscribe((data) => {
      this.allCourses = data['data']
    })
  }
  compareTwoDates1() {
    setTimeout(() => {
      var show = document.getElementById('closebtn')
      this.dateValidate1 = { isError: false, errorMessage: '' }
      if (this.datePipe.transform(this.HFormGroup1.value.certificateIssueDateTo, 'yyyy-MM-dd') < this.datePipe.transform(this.HFormGroup1.value.certificateIssueDateFrom, 'yyyy-MM-dd')) {
        this.dateValidate1 = { isError: true, errorMessage: "End Date is bigger than start date!" }
      }
      if (this.dateValidate1.isError == true) {
        window.scroll(0, 0)
        if (show) {
          show.style.display = 'block'
        }
      }
    }, 0);
  }
  certificateSummarySubmit() {
    const formValue = this.HFormGroup1.value
    const certificateSummaryBody: any = {
      certificateIssueDateFrom: this.datePipe.transform(formValue.certificateIssueDateFrom, 'yyyy-MM-dd'),
      certificateIssueDateTo: this.datePipe.transform(formValue.certificateIssueDateTo, 'yyyy-MM-dd'),
    }
    if (formValue.courseId && formValue.courseId !== 'all') {
      certificateSummaryBody.courseid = formValue.courseId
    }
    var show = document.getElementById('closebtn')
    if ((this.dateValidate1.isError == false)) {
      this.apiService.postAPI('getcertificatereport', certificateSummaryBody).subscribe((data) => {
        this.baseApi = "https://api.wonderit.com.au:5000/"
        window.open(this.baseApi + data['data'])
      })
    }
    else {
      show.style.display = 'block'
      window.scroll(0, 0)
    }
  }
}
