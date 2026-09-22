import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import { StudentsService } from './students.service'
import { HttpClient } from '@angular/common/http'
import { MatDialog } from '@angular/material/dialog'
import { MatPaginator } from '@angular/material/paginator'
import { MatSort } from '@angular/material/sort'
import { fromEvent } from 'rxjs'
import { MatMenuTrigger } from '@angular/material/menu'
import { MatTableDataSource } from '@angular/material/table'
import { ApiService } from '../../../api/api.service'
import { FormControl } from '@angular/forms'
import { StudentDialogComponent } from './dialogs/student-dialog/student-dialog.component'
import { Router } from '@angular/router'
import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders'
import { Console } from 'console'
import { DatePipe } from '@angular/common'

import * as _moment from 'moment';
import { default as _rollupMoment } from 'moment';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core'
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter'
const moment = _rollupMoment || _moment;
export interface Students {
  clientId2: string
  Name: string
  email2: string
  course: string
  startDate2: Date
  endDate2: Date
  certificateType: string
  certificate: string
  actions2
}
export interface EnrolledCourses {
  courseName: string,
  startDate: string,
  endDate: string,
  actions
}
@Component({
  selector: 'app-all-student',
  templateUrl: './all-student.component.html',
  styleUrls: ['./all-student.component.sass'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    DatePipe
  ],
})
export class AllStudentComponent implements OnInit {
  mode = new FormControl('side')
  students
  displayedColumns: string[] = ['clientId2', 'name', 'email2', 'course', 'startDate2', 'endDate2', 'certificateType', 'issueDate', 'certificate', 'actions2']
  dataSource: MatTableDataSource<Students>
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator
  @ViewChild(MatSort, { static: true }) sort: MatSort
  @ViewChild('filter', { static: true }) filter: ElementRef

  courseIntakeFilter = new FormControl();
  bulkAgentFilter = new FormControl();
  bulkClientIdFilter = new FormControl();
  bulkApplicationStatusFilter = new FormControl();
  agentFilter = new FormControl();
  usiFilter = new FormControl();
  clientId2Filter = new FormControl('')
  nameFilter = new FormControl('')
  email2Filter = new FormControl('')
  studentNameFilter = new FormControl();
  emailFilter = new FormControl();
  courseFilter = new FormControl('')
  startDateFilter = new FormControl('')
  endDateFilter = new FormControl('')
  issueDateFilter = new FormControl('')
  certificateType = new FormControl('')
  certificate = new FormControl('')

  filteredValues = {
    courseIntakeDateId: '',
    clientid: '',
    firstname: '',
    email: '',
    coursecode: '',
    startdate: '',
    enddate: '',
    issuedate: ''
  }
  allCourseIntakeDate
  courseIntakeDateId = ''
  clientId2 = ''
  name = ''
  lastName = ''
  email2 = ''
  course = ''
  courseName = ''
  startDate = ''
  endDate = ''
  dataString
  doc
  blank = ''

  displayedColumns2: string[] = ['courseName', 'startDate', 'endDate', 'actions']
  dataSource2: MatTableDataSource<EnrolledCourses>
  studentId
  enrolledCourses
  errorsReq = { isError: false, errorMessage: '' }
  checkngIF = false
  @ViewChild(MatPaginator, { static: true }) paginator2: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort2: MatSort;
  @ViewChild('filter', { static: true }) filter2: ElementRef;
  @ViewChild(MatMenuTrigger)
  highlighter = 0
  userInfo: any
  allAgents: any
  allApplicationStatus: any
  getAll: any
  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public studentsService: StudentsService,
    private apiService: ApiService,
    private datePipe: DatePipe,
    private router: Router,
  ) {
    this.getStudents()
  }

  changeValue(value: any) {
    this.courseIntakeDateId = value;
    // console.log('exp',value)
  }
  ngOnInit() {
    this.userInfo = JSON.parse(localStorage.getItem('currentUser'))
    this.getAll = JSON.parse(window.localStorage.getItem('getAll'))
    this.allApplicationStatus = this.getAll[0].ApplicationStatus
    this.dataSource = new MatTableDataSource() // create new object
    this.dataSource.paginator = this.paginator
    this.dataSource.sort = this.sort
    //Filtering
    this.apiService.getAPI('getcourseintakedate').subscribe((data) => {
      //console.log(data);
      this.allCourseIntakeDate = data['data']
    })
    this.apiService.getAPI("getagent").subscribe((data) => {
      this.allAgents = data["data"];
    });
    //this.courseIntakeFilter.setValue('id')
    // console.log(this.courseIntakeFilter.value)
    this.courseIntakeFilter.valueChanges.subscribe(courseIntakeDateId => {
      this.filteredValues.courseIntakeDateId = courseIntakeDateId;
      this.dataSource.filter = JSON.stringify(this.filteredValues)
    })

    this.dataSource.filterPredicate = this.createFilter()


    this.clientId2Filter.valueChanges.subscribe(clientId2 => {
      this.filteredValues.clientid = clientId2;
      this.dataSource.filter = JSON.stringify(this.filteredValues)
    })

    this.nameFilter.valueChanges.subscribe(name => {
      this.filteredValues.firstname = name;
      this.dataSource.filter = JSON.stringify(this.filteredValues)
    })
    // this.lastNameFilter.valueChanges.subscribe(lastName => {
    //   this.filteredValues.lastName = lastName;
    //   this.dataSource.filter = JSON.stringify(this.filteredValues)
    // })
    this.email2Filter.valueChanges.subscribe(email2 => {
      this.filteredValues.email = email2;
      this.dataSource.filter = JSON.stringify(this.filteredValues)
    })
    this.courseFilter.valueChanges.subscribe(course => {
      this.filteredValues.coursecode = course;
      this.dataSource.filter = JSON.stringify(this.filteredValues)
    })
    // this.courseNameFilter.valueChanges.subscribe(courseName =>{
    //   this.filteredValues.courseName = courseName;
    //   this.dataSource.filter = JSON.stringify(this.filteredValues)
    // })
    this.startDateFilter.valueChanges.subscribe(startDate => {
      this.filteredValues.startdate = startDate;
      this.dataSource.filter = JSON.stringify(this.filteredValues)
    })
    this.endDateFilter.valueChanges.subscribe(endDate => {
      this.filteredValues.enddate = endDate;
      this.dataSource.filter = JSON.stringify(this.filteredValues)
    })
    this.issueDateFilter.valueChanges.subscribe(issueDate => {
      this.filteredValues.issuedate = issueDate;
      this.dataSource.filter = JSON.stringify(this.filteredValues)
    })
  }
  getStudents() {
    this.apiService.getAPI('getstudentcertificatelist').subscribe((data) => {
      //console.log(data);
      this.students = data['data']
      this.students.forEach((student, index) => {
        // 1. Use the numeric index from forEach (safer than a string index from for...in)
        student.rowID = index;

        // 2. Transform dates
        student.startDate = this.datePipe.transform(student.startdate, 'dd/MM/yyyy');
        student.endDate = this.datePipe.transform(student.enddate, 'dd/MM/yyyy');
        student.issueDate = this.datePipe.transform(student.certificateissuedate, 'dd/MM/yyyy') || '';

        // 3. Set null for empty string
        if (student.certificatepath === "") {
          student.certificatepath = null;
        }

        // 4. Use a 'switch' statement for a clean multi-way check
        switch (student.certificatetype) {
          case "C":
            student.certificateFlag = true;
            break;
          case "S":
            student.attainmentFlag = true;
            break;
          case "R":
            student.sorFlag = true;
            break;
          case "O":
            student.qualificationAttainmentFlag = true;
            break;
        }
      });
      // console.log('check', this.students)
      this.students = this.students.sort((a, b) => {
        if (a.clientid < b.clientid) {
          return 1;
        } else if (a.clientid > b.clientid) {
          return -1;
        } else {
          return 0;
        }
      });
      this.students.forEach((student, index) => {
        student.rowID = index;
      });
      // console.log('this.students',this.students)
      this.dataSource.data = this.students // on data receive populate dataSource.data array
      return data
    })
  }
  createFilter(): (data: any, filter: string) => boolean {
    let filterFunction = function (data, filter): boolean {
      let searchTerms = JSON.parse(filter);
      return data.clientid.toLowerCase().toString().indexOf(searchTerms.clientid.toLowerCase()) !== -1
        && (data.firstname || '').toLowerCase().indexOf(searchTerms.firstname.toLowerCase()) !== -1
        && data.email.toLowerCase().indexOf(searchTerms.email.toLowerCase()) !== -1
        && (data.coursecode || '').toLowerCase().indexOf(searchTerms.coursecode.toLowerCase()) !== -1
        && (data.startdate || '').toLowerCase().indexOf(searchTerms.startdate.toLowerCase()) !== -1
        && (data.enddate || '').toLowerCase().indexOf(searchTerms.enddate.toLowerCase()) !== -1
        && (data.issueDate || '').toLowerCase().indexOf((searchTerms.issuedate || '').toLowerCase()) !== -1;
    }
    return filterFunction;
  }
  search(cid: any, aid: any, asid: any, clid: any, uid: any, name: any, email: any) {
    let queryParams = [];

    // Build query string based on available parameters
    if (cid) {
      queryParams.push(`courseid=${cid}`);
    }
    if (aid) {
      queryParams.push(`agentid=${aid}`);
    }
    if (asid) {
      queryParams.push(`applicationstatusid=${asid}`);
    }
    if (clid) {
      queryParams.push(`clientid=${clid}`);
    }
    if (uid) {
      queryParams.push(`usiNo=${uid}`);
    }
    if (name) {
      queryParams.push(`studentname=${name}`);
    }
    if (email) {
      queryParams.push(`email=${email}`);
    }
    // console.log(queryParams)
    // If there are any query parameters, make the API call
    if (queryParams.length > 0) {
      const queryString = queryParams.join('&');
      this.apiService.getAPI(`getstudentcertificatelist?${queryString}`).subscribe((data) => {
        console.log(data);
        // if (this.HFormGroup1.valid) {
        if (data['data'].msg) {
          // window.scroll(0, 0);
          var show = document.getElementById('closebtn')
          this.errorsReq = { isError: true, errorMessage: data['data'].msg }
          this.dataSource.data = []
        }
        else {
          let students = data['data']
          students.forEach(student => {
            // 1. Use template literals for cleaner strings
            student.fullname = `${student.firstname} ${student.lastname}`;

            // 2. Transform dates
            // (Note: This creates new properties 'startDate' and 'endDate' from lowercase versions)
            student.startDate = this.datePipe.transform(student.startdate, 'dd/MM/yyyy');
            student.endDate = this.datePipe.transform(student.enddate, 'dd/MM/yyyy');
            student.issueDate = this.datePipe.transform(student.certificateissuedate, 'dd/MM/yyyy') || '';

            // 3. Set null for empty string
            if (student.certificatepath === "") {
              student.certificatepath = null;
            }

            // 4. Use a 'switch' statement for readability
            // This is much cleaner than multiple 'else if' blocks
            switch (student.certificatetype) {
              case "C":
                student.certificateFlag = true;
                break;
              case "S":
                student.attainmentFlag = true;
                break;
              case "R":
                student.sorFlag = true;
                break;
              case "O":
                student.qualificationAttainmentFlag = true;
                break;
            }
          });
          this.dataSource.data = students; // on data receive populate dataSource.data array
          // console.log('scheck',this.dataSource.data)
        }
        if (show) {
          show.style.display = 'block'
        }
        return data;
      })
    }
  }
  showInfo(row) {
    let tempDirection;
    if (localStorage.getItem('isRtl') === 'true') {
      tempDirection = 'rtl';
    } else {
      tempDirection = 'ltr';
    }
    const dialogRef = this.dialog.open(StudentDialogComponent, {
      data: { student_Id: row.studentId },
      direction: tempDirection,
    });
  }
  refresh() {
    this.loadData()
  }
  addNew() {
    this.router.navigate(['/admin/enrolment/new-student']);
  }
  public loadData() {
    this.dataSource = new MatTableDataSource() // create new object
    this.getStudents()
    this.dataSource.paginator = this.paginator
    this.dataSource.sort = this.sort
    fromEvent(this.filter.nativeElement, 'keyup').subscribe(() => {
      if (!this.dataSource) {
        return;
      }
      this.dataSource.filter = this.filter.nativeElement.value;
    });
  }
  taskClick(i, id, nav: any): void {
    nav.open();
    window.scroll(0, 0)
    this.highlighter = i
    console.log(i)
    this.studentId = id
    this.apiService.getAPI(`getstudentenrolmentbystudentid?id=${this.studentId}`).subscribe((data) => {
      console.log(data);
      this.enrolledCourses = data['data']

      setTimeout(() => {
        if (this.enrolledCourses) {
          this.highlighter = i
        }
      }, 0)
    })

    console.log(this.highlighter)

  }
  closeSlider(nav: any) {
    if (nav.open()) {
      nav.close();
    }
    this.highlighter = -1
    console.log(this.highlighter)
  }
  // View Enrolled Courses
  getEnrolledCourses() {
    this.apiService.getAPI(`getstudentenrolmentbystudentid?id=${this.studentId}`).subscribe((data) => {
      //console.log(data);
      this.enrolledCourses = data['data']
    })
  }
  editStudent(data) {
    var step = 'S'
    if (data.certificateid) {
      step = 'C'
      this.router.navigate([`/admin/certificate/certificate/${step}/${data.certificateid}/${data.studentenrolmentid}`]);
    }
    else {
      step = 'E'
      this.router.navigate([`/admin/certificate/certificate/${step}/${data.studentenrolmentid}`]);
    }
  }
  deleteCertificate(eid, id) {
    var step = eid
    this.router.navigate([`/admin/certificate/delete-certificate/${step}/${id}`]);
  }
  editEnrCourse(id) {
    var step = 'C'
    this.router.navigate([`/admin/enrolment/edit-student/${step}/${id}`]);
  }
  addEnrCourse(id) {
    this.router.navigate([`/admin/enrolment/new-student/enrol-course/${id}`]);
  }
  downloadCertificate(id, temp, staffid) {
    if (this.userInfo.college_id == '23') {
      if (temp == "NSW") {
        if (staffid == null) {
          window.open(`https://api.wonderit.com.au:8000/album/report/?inst_id=${this.userInfo.college_id}&type=certificate_nsw&sid=${id}&_token=${this.userInfo.refresh_token}`)
        }
        else{
          window.open(`https://api.wonderit.com.au:8000/album/report/?inst_id=${this.userInfo.college_id}&type=certificate_nsw_${staffid}&sid=${id}&_token=${this.userInfo.refresh_token}`)
        }
      }
      else {
        window.open(`https://api.wonderit.com.au:8000/album/report/?inst_id=${this.userInfo.college_id}&type=certificate&sid=${id}&_token=${this.userInfo.refresh_token}`)
      }
    }
    else {
      window.open(`https://api.wonderit.com.au:8000/album/report/?inst_id=${this.userInfo.college_id}&type=certificate&sid=${id}&_token=${this.userInfo.refresh_token}`)
    }

  }
  downloadAttainment(id) {
    window.open(`https://api.wonderit.com.au:8000/album/report/?inst_id=${this.userInfo.college_id}&type=attainment&sid=${id}&_token=${this.userInfo.refresh_token}`)

  }
  downloadResult(id, temp) {
    if (temp == 'NSW') {
      window.open(`https://api.wonderit.com.au:8000/album/report/?inst_id=${this.userInfo.college_id}&type=sor_nsw&sid=${id}&_token=${this.userInfo.refresh_token}`)
    }
    else {
      window.open(`https://api.wonderit.com.au:8000/album/report/?inst_id=${this.userInfo.college_id}&type=sor&sid=${id}&_token=${this.userInfo.refresh_token}`)
    }
  }
  downloadQualificationAttainment(id) {
    window.open(`https://api.wonderit.com.au:8000/album/report/?inst_id=${this.userInfo.college_id}&type=qualification_attainment&sid=${id}&_token=${this.userInfo.refresh_token}`)
  }
}
