import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter'
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core'
import { DatePipe } from '@angular/common'
import { ApiService } from '../../../api/api.service'
import { ReplaySubject, Subscription } from 'rxjs'
import { HttpClient } from '@angular/common/http'
import { UploadService } from '../../../services/upload.service'
import { StateService } from '../../../services/state.service'
import { MatStepper } from '@angular/material/stepper'
import { ActivatedRoute, Router } from '@angular/router'
import * as _moment from 'moment';
import { default as _rollupMoment } from 'moment';
import { MatTableDataSource } from '@angular/material/table'
import { MatPaginator } from '@angular/material/paginator'
import { MatSort } from '@angular/material/sort'
import { SelectionModel } from '@angular/cdk/collections'
import { MatCheckboxChange } from '@angular/material/checkbox'
import { finalize } from 'rxjs/operators';

const moment = _rollupMoment || _moment;

/** Certificates with more units than this always use the extended report. */
const EXT_CERTIFICATE_UNIT_LIMIT = 25;

export interface outcome {
  rowID
  units: string
  outcomeNational: string
  stDate: string
  enDate: string
  hours: string
}

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.sass'],
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
export class CertificateComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper: MatStepper
  displayedColumns: string[] = ['rowID', 'units', 'outcomeNational', 'stDate', 'enDate', 'hours']
  dataSource: MatTableDataSource<outcome>
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator
  @ViewChild(MatSort, { static: true }) sort: MatSort
  @ViewChild('filter', { static: true }) filter: ElementRef
  selection = new SelectionModel<outcome>(true, []);
  selectionRadio = new SelectionModel<outcome>(true, []);
  selectedNumbers = new ReplaySubject<number[]>(1);
  HFormGroup1: FormGroup
  HFormGroup2: FormGroup
  subscription: Subscription
  certificateTypeChangeSubscription: Subscription

  studentID
  step
  editEnrolment
  enrolemntID
  name = "loading..."
  courseName = "loading..."
  disabled

  certificateissuenumber
  certificate
  issueNumber
  baseApi
  link
  trainingActId
  outcomeCheck
  selected: any = []
  outcome
  student
  course
  authority_type = 'C';

  editCertificate = {
    completiondate: '',
    certificateissuedate: '',
    certificateissuenumber: '',
    certificatetype: '',
    issuedflag: '',
    rtotype: '',
    trainerstatenameshort: '',
    staffid: ''
  }

  dateValidate1 = { isError: false, errorMessage: '' }
  loading: boolean
  userInfo: any
  certificateId: any

  error = { isError: false, errorMessage: '' }
  usiError = { isError: false, errorMessage: '' }
  errorAll: any = { isAllerror: false, errorMsg: '' };
  errorsReqEn: any = { isError: false, errorMessage: '' };
  errorsReq = { isError: false, errorMessage: '' };
  errors = false
  err_msg
  show_msg = false
  show_msg2 = false
  allStaff

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private datePipe: DatePipe,
    public httpClient: HttpClient,
    private uploadService: UploadService,
    private state: StateService,
    private actRoute: ActivatedRoute,
    private router: Router,
  ) {
    this.step = this.actRoute.snapshot.params.step;
    if (this.step === 'E') {
      this.enrolemntID = this.actRoute.snapshot.params.id;
    } else {
      this.certificateId = this.actRoute.snapshot.params.id;
      this.enrolemntID = this.actRoute.snapshot.params.eid;
    }
    this.getStudentInfo()
    this.getOutcome()
  }

  ngOnInit(): void {
    this.userInfo = JSON.parse(localStorage.getItem('currentUser'))
    this.disabled = false
    this.loading = false
    this.dataSource = new MatTableDataSource()
    this.dataSource.paginator = this.paginator
    this.dataSource.sort = this.sort

    this.HFormGroup1 = this.fb.group({
      completionDate: ['', [Validators.required]],
      certificateIssueDate: ['', Validators.required],
      certificateIssueNumber: ['', [Validators.maxLength(25)]],
      certificateType: ['C'],
      certificateReportType: ['certificate'],
      authority: ['C'],
      location_type: ['M'],
      pageCount: ['2'], // > 25 units only: '2' = extcertificate, '3' = temp_extcertificate (non-23 only)
      rtoType: ['L'],
      trainingActivityId: [''],
      Issuedflag: ['Y', [Validators.maxLength(10)]],
      trainerStateNameShort: 'VLC',
      staffId: 0
    })

    this.certificateTypeChangeSubscription = this.HFormGroup1.get('certificateType')?.valueChanges.subscribe((value) => {
      if (this.HFormGroup1.get('Issuedflag')?.value === 'Y') {
        this.getCertificateIssueNumber(value)
      }
    })

    if (this.step === 'C') {
      this.apiService.getAPI(`getcertificate?id=${this.certificateId}`).subscribe((data) => {
        if (!data['data'].msg) {
          this.editCertificate = data['data'][0]
          this.HFormGroup1.patchValue({
            completionDate: moment(this.editCertificate.completiondate),
            certificateIssueDate: moment(this.editCertificate.certificateissuedate),
            certificateIssueNumber: this.editCertificate.certificateissuenumber,
            certificateType: this.editCertificate.certificatetype,
            Issuedflag: this.editCertificate.issuedflag,
            rtoType: this.editCertificate.rtotype,
            trainerStateNameShort: this.editCertificate.trainerstatenameshort,
            staffId: this.editCertificate.staffid
          })

          if (
            this.HFormGroup1.get('Issuedflag')?.value === 'Y' &&
            (!this.editCertificate.certificateissuenumber || this.editCertificate.certificateissuenumber === '')
          ) {
            this.getCertificateIssueNumber(this.HFormGroup1.get('certificateType')?.value)
          }
        } else {
          if (this.HFormGroup1.get('Issuedflag')?.value === 'Y') {
            this.getCertificateIssueNumber(this.HFormGroup1.get('certificateType')?.value)
          }
        }
      })
    } else {
      if (this.HFormGroup1.get('Issuedflag')?.value === 'Y') {
        this.getCertificateIssueNumber(this.HFormGroup1.get('certificateType')?.value)
      }
    }

    this.apiService.getAPI('getstaff').subscribe((data) => {
      this.allStaff = data['data']
    })

    this.apiService.getAPI(`verifyoutcomeforcertificate?id=${this.enrolemntID}`).subscribe((data) => {
      this.outcomeCheck = data['data']
      var show = document.getElementById('closebtn')
      this.error = { isError: false, errorMessage: '' }
      if (!this.outcomeCheck.msg) {
        this.error = { isError: true, errorMessage: this.outcomeCheck[0].error_msg }
        window.scroll(0, 0)
        if (show) {
          show.style.display = 'block'
        }
      }
    })
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    if (this.certificateTypeChangeSubscription) {
      this.certificateTypeChangeSubscription.unsubscribe()
    }
  }

  /** Number of units loaded for this enrolment (0 until the API responds). */
  get unitCount(): number {
    return Array.isArray(this.trainingActId) ? this.trainingActId.length : 0
  }

  /** True when the plain "Certificate" option is selected (not completion, SOA or SOR). */
  get isPlainCertificate(): boolean {
    const v = this.HFormGroup1?.value
    return !!v && v.certificateType === 'C' && v.certificateReportType === 'certificate'
  }

  /** Show the 2 / 3 pages choice: non-23 layout, plain certificate, more than 25 units. */
  get showPageOption(): boolean {
    return this.userInfo?.college_id !== 23
      && this.isPlainCertificate
      && this.unitCount > EXT_CERTIFICATE_UNIT_LIMIT
  }

  /** Value for the non-23 certificate type radio group, so the current choice shows as selected. */
  get certificateOption(): string {
    const v = this.HFormGroup1?.value
    if (!v) return ''
    if (v.certificateType === 'C') {
      return v.certificateReportType === 'certificate_complete' ? 'completion' : 'certificate'
    }
    return v.certificateType
  }

  public issuedFlagChange(newValue) {
    if (newValue == 'Y') {
      this.getCertificateIssueNumber(this.HFormGroup1.get('certificateType')?.value)
    } else {
      this.HFormGroup1.patchValue({
        certificateIssueNumber: null
      })
    }
  }

  getCertificateIssueNumber(type: string) {
    if (!type) {
      this.HFormGroup1.patchValue({
        certificateIssueNumber: null
      })
      return
    }

    let url = `getcertificateissuenumber?certificateType=${encodeURIComponent(type)}&studentEnrolmentId=${encodeURIComponent(this.enrolemntID)}`

    this.apiService
      .getAPI(url)
      .subscribe((data) => {
        this.issueNumber = data['data']

        if (this.issueNumber) {
          this.issueNumber = this.issueNumber.split(":")[1].trim();

          this.HFormGroup1.patchValue({
            certificateIssueNumber: this.issueNumber
          })
        }
      })
  }

  compareTwoDates1() {
    setTimeout(() => {
      var show = document.getElementById('closebtn')
      this.dateValidate1 = { isError: false, errorMessage: '' }
      if (this.datePipe.transform(this.HFormGroup1.value.certificateIssueDate, 'yyyy-MM-dd') < this.datePipe.transform(this.HFormGroup1.value.completionDate, 'yyyy-MM-dd')) {
        this.dateValidate1 = { isError: true, errorMessage: "Issue Date is bigger than Completion Date!" }
      }
      if (this.dateValidate1.isError == true) {
        window.scroll(0, 0)
        if (show) {
          show.style.display = 'block'
        }
      }
    }, 0);
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  sendSelectedNumbers() {
    let selectedNumbers: number[] = [];
    for (let item of this.selection.selected) {
      selectedNumbers.push(item.rowID)
    }
    return selectedNumbers;
  }

  toggle(item, event: MatCheckboxChange) {
    if (event.checked) {
      this.selected.push(item);
    } else {
      const index = this.selected.indexOf(item);
      if (index >= 0) {
        this.selected.splice(index, 1);
      }
    }
  }

  getOutcome() {
    this.apiService.getAPI(`gettrainingactivity?id=${this.enrolemntID}`).subscribe((data) => {
      this.trainingActId = data['data']
      this.trainingActId.sort((a, b) => {
        if (a.unitorderby < b.unitorderby) {
          return -1;
        }
        if (a.unitorderby > b.unitorderby) {
          return 1;
        }
        return 0;
      });
      let trainingArray
      trainingArray = data['data']
      for (var i in trainingArray) {
        trainingArray[i].rowID = i
      }
      this.dataSource.data = trainingArray
      return data
    })
  }

  getStudentInfo() {
    this.apiService.getAPI(`getstudentenrolmentbystudentenrolmentid?id=${this.enrolemntID}`).subscribe((data) => {
      this.student = data['data'][0]
      this.name = this.student.firstname + " " + this.student.lastname
      this.courseName = this.student.coursename
      if (this.student.usiverificationstatus == null || this.student.usiverificationstatus == "") {
        this.usiError.isError = true
        this.usiError.errorMessage = "USI is not verified"
      }
      else if (this.student.usiverificationstatus) {
        if (this.student.usiverificationstatus.includes('Invalid')) {
          this.usiError.isError = true
          this.usiError.errorMessage = "USI is not verified"
        }
        else if (this.student.usiverificationstatus.includes('NoMatch')) {
          this.usiError.isError = true
          this.usiError.errorMessage = "USI is verified but all data are not matched"
        }
      }
    })
  }

  getCertificate() {
    this.disabled = true;
    this.error.isError = false;
    this.error.errorMessage = '';
    this.errorsReqEn = { isError: false, errorMessage: '' };
    this.errorsReq = { isError: false, errorMessage: '' };

    const certificateBody = { ...this.HFormGroup1.value };

    // pageCount only decides which report opens; it is not sent to the API.
    delete certificateBody.pageCount;

    certificateBody.Issuedflag = 'Y';
    certificateBody.completionDate = this.datePipe.transform(certificateBody.completionDate, 'yyyy-MM-dd');
    certificateBody.certificateIssueDate = this.datePipe.transform(certificateBody.certificateIssueDate, 'yyyy-MM-dd');

    const rows = this.sendSelectedNumbers();
    let nums: number[] = [];
    if (certificateBody.certificateType === 'C' || certificateBody.certificateType === 'R') {
      nums = this.trainingActId.map(act => act.trainingactivityid);
    } else {
      nums = rows.map(rowIndex => this.trainingActId[rowIndex].trainingactivityid);
    }

    certificateBody.trainingActivityId = nums;
    certificateBody.studentEnrolmentId = parseInt(this.enrolemntID, 10);
    certificateBody.userId = this.userInfo.userid;

    if (!this.outcomeCheck.msg && certificateBody.certificateType !== 'S') {
      this.errorsReq = { isError: true, errorMessage: this.outcomeCheck[0].error_msg };
      window.scroll(0, 0);
      this._showErrorUI();
      this.disabled = false;
      return;
    }

    this.apiService.postAPI('addcertificate', certificateBody).pipe(
      finalize(() => this.disabled = false)
    ).subscribe(
      (data: any) => {
        if (data?.data?.msg) {
          this.errorsReqEn = { isError: true, errorMessage: data.data.msg };
          window.scroll(0, 0);
          this._showErrorUI();
        } else {
          this._handleCertificateSuccess(certificateBody, data);
        }
      },
      (apiError) => {
        console.error('API Error:', apiError);
        this.errorsReqEn = { isError: true, errorMessage: 'An unexpected error occurred. Please try again.' };
        window.scroll(0, 0);
        this._showErrorUI();
      }
    );
  }

  private _getCertificateReportType(certificateBody: any): string | null {
    const { certificateType, trainerStateNameShort } = certificateBody;
    const { college_id } = this.userInfo;
    const isCollege23 = (college_id === 23);
    const isNSW = (trainerStateNameShort === 'NSW');

    switch (certificateType) {
      case 'C':
        if (this.HFormGroup1.value.certificateReportType === 'certificate_complete') {
          return 'certificate_complete';
        }

        if (isCollege23 && isNSW) {
          return `certificate_nsw_${this.HFormGroup1.value.staffId}`;
        }

        // More than 25 units: 2 pages (default) = extcertificate, 3 pages = temp_extcertificate.
        if (this.unitCount > EXT_CERTIFICATE_UNIT_LIMIT) {
          if (!isCollege23 && this.HFormGroup1.value.pageCount === '3') {
            return 'temp_extcertificate';
          }
          return 'extcertificate';
        }

        // 25 units or fewer: standard certificate, no pages option.
        return 'certificate';

      case 'S':
        return 'attainment';

      case 'O':
        return 'qualification_attainment';

      case 'R':
        if (isCollege23 && isNSW) return 'sor_nsw';
        return 'sor';

      default:
        return null;
    }
  }

  private _handleCertificateSuccess(certificateBody: any, data: any) {
    const reportType = this._getCertificateReportType(certificateBody);

    if (reportType) {
      const { college_id, refresh_token } = this.userInfo;

      const authority = this.HFormGroup1.value.authority; // C or D

      let reportName = reportType;

      // Director signature: certificate_2, extcertificate_2, ...
      // Exception: 3 pages + Director uses the temp_certificate_2 report.
      if (authority === 'D') {
        reportName = reportType === 'temp_extcertificate'
          ? 'temp_certificate_2'
          : reportName + '_2';
      }

      if (reportType === 'certificate_complete') {
        const location = this.HFormGroup1.value.location_type;

        if (location === 'S') {
          reportName += '_Syd';
        }
        else if (location === 'G') {
          reportName += '_Gold';
        }
        else if (location === 'P') {
          reportName += '_Perth';
        }
      }

      const url =
        `https://api.wonderit.com.au:8000/album/report/?inst_id=${college_id}&type=${reportName}&sid=${data}&_token=${refresh_token}`;

      window.open(url, '_blank');
    }

    this.router.navigate(['/admin/certificate/all-student']);
  }

  private _showErrorUI() {
    const show = document.getElementById('closebtn');
    if (show) {
      show.style.display = 'block';
    }
  }

  getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  onCertificateUpdate() {
    this.show_msg = false
    this.show_msg2 = false
    const certificateBody = this.HFormGroup1.value
    certificateBody.completionDate = this.datePipe.transform(certificateBody.completionDate, 'yyyy-MM-dd')
    certificateBody.certificateIssueDate = this.datePipe.transform(certificateBody.certificateIssueDate, 'yyyy-MM-dd')
    certificateBody.trainingActivityId = this.trainingActId
    certificateBody.studentEnrolmentId = this.enrolemntID
    certificateBody.userId = this.userInfo.userid

    var show = document.getElementById('closebtn')
    this.errorsReqEn = { isError: false, errorMessage: '' };
    this.errorsReq = { isError: false, errorMessage: '' }
    if (this.outcomeCheck.msg) {
      this.apiService.postAPI('addcertificate', certificateBody).subscribe((data) => {
        if (data['data'].msg != undefined) {
          this.errorsReqEn = { isError: true, errorMessage: data['data'].msg }
          window.scroll(0, 0)
          if (show) {
            show.style.display = 'block'
          }
        }
        else {
          this.router.navigate(['/admin/certificate/all-student'])
        }
      })
    }
    else {
      this.errorsReq = { isError: true, errorMessage: this.outcomeCheck[0].error_msg }
      window.scroll(0, 0)
      if (show) {
        show.style.display = 'block'
      }
    }
  }

  onCertificateSelection(value: string) {
    if (value === 'certificate') {
      this.HFormGroup1.patchValue({
        certificateType: 'C',
        certificateReportType: 'certificate'
      });
    }
    else if (value === 'completion') {
      this.HFormGroup1.patchValue({
        certificateType: 'C',
        certificateReportType: 'certificate_complete',
        pageCount: '2'
      });
    }
    else {
      this.HFormGroup1.patchValue({
        certificateType: value,
        certificateReportType: '',
        pageCount: '2'
      });
    }
  }

  previewCertificate() {
    window.open(`https://api.wonderit.com.au:8000/report/edit?inst_id=${this.userInfo.college_id}`)
  }
}