import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexMarkers,
  ApexYAxis,
  ApexGrid,
  ApexTooltip,
  ApexLegend,
} from 'ng-apexcharts';
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  colors: string[];
  yaxis: ApexYAxis;
  grid: ApexGrid;
  legend: ApexLegend;
  tooltip: ApexTooltip;
};
import { AuthService } from 'src/app/core/service/auth.service';
import { MatDialog } from '@angular/material/dialog'
import { MatPaginator } from '@angular/material/paginator'
import { MatSort } from '@angular/material/sort'
import { fromEvent } from 'rxjs'
import { MatMenuTrigger } from '@angular/material/menu'
import { MatTableDataSource } from '@angular/material/table'
import { ApiService } from '../../../api/api.service'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
// import { StudentDialogComponent } from './dialogs/student-dialog/student-dialog.component'
import { Router } from '@angular/router'
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DatePipe } from '@angular/common';
export interface courseIntakes {
  // courseIntakeDateId
  courseCode
  courseName
  startDate
  endDate
  actions
}
export interface Students {
  statusCheck,
  courseId,
  unitId,
  unitCode,
  unitName,
  unitType,
  vetFlag,
  AVETMISS
}
const ELEMENT_DATA: Students[] = []
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
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
export class MainComponent implements OnInit {
  displayedColumns: string[] = ['courseCode', 'courseName', 'startDate', 'endDate', 'actions']
  displayedColumns1: string[] = ['bulkClientId', 'bulkName', 'bulkEmail', 'bulkEnDate']

  dataSource1: MatTableDataSource<courseIntakes>
  dataSource: MatTableDataSource<Students>

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('filter', { static: true }) filter: ElementRef;
  @ViewChild(MatPaginator, { static: true }) tableTwoPaginator: MatPaginator
  @ViewChild(MatSort, { static: true }) tableTwoSort: MatSort
  courseIdFilter = new FormControl('')
  courseCodeFilter = new FormControl('')
  courseNameFilter = new FormControl('')
  startDateFilter = new FormControl('')
  endDateFilter = new FormControl('')
  filteredValues = {
    courseintakedateid: '',
    coursecode: '',
    coursename: '',
    startdate: '',
    enddate: ''
  }
  clientIdFilter = new FormControl('')
  nameFilter = new FormControl('')
  emailFilter = new FormControl('')
  studentFilteredValues = {
    clientid: '',
    firstname: '',
    email: ''
  }

  HFormGroup1: FormGroup
  courseId
  startYear
  filteredData
  allCourses
  allCourseIntakes
  getAll
  public lineChartOptions: Partial<ChartOptions>;
  totalCourse = 0
  check = false
  students: any;
  selectedRow = -1
  highlighter = 0
  courseName: any;
  totalStudent = 0
  totalUnits = 0
  panelExpanded = true;
  userInfo: any;
  dashboardData: any = {}
  courseSummary: any[] = []
  totalStudentCount = 0
  enrolledThisMonth = 0
  enrolledGrowthCount = 0
  enrolledGrowthPercent = 0
  totalCertificateIssued = 0
  totalPending = 0
  courseColors = ['purple', 'blue', 'green', 'orange', 'red', 'cyan', 'card4', 'purple-dark']
  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private authService: AuthService,
    private datePipe: DatePipe,
    private router: Router,
    private apiService: ApiService,
  ) {
    // this.getCourseIntakes()
    this.getStudents()
  }
  ngOnInit() {
    this.userInfo = JSON.parse(localStorage.getItem('currentUser'))
    this.authService.storeUserData(this.userInfo.access_token)
    this.chart1();
    this.dataSource = new MatTableDataSource() // create new object
    this.dataSource.paginator = this.tableTwoPaginator
    this.dataSource.sort = this.tableTwoSort

    // this.dataSource1 = new MatTableDataSource() // create new object
    // this.dataSource1.paginator = this.paginator
    // this.dataSource1.sort = this.sort
    // this.dataSource1.filterPredicate = this.createFilter();
    // this.courseIdFilter.valueChanges.subscribe(courseintakedateid => {
    //   this.filteredValues.courseintakedateid = courseintakedateid;
    //   this.dataSource1.filter = JSON.stringify(this.filteredValues)
    // })
    // this.courseCodeFilter.valueChanges.subscribe(coursecode => {
    //   this.filteredValues.coursecode = coursecode;
    //   this.dataSource1.filter = JSON.stringify(this.filteredValues)
    // })
    // this.courseNameFilter.valueChanges.subscribe(coursename => {
    //   this.filteredValues.coursename = coursename;
    //   this.dataSource1.filter = JSON.stringify(this.filteredValues)
    // })
    // this.startDateFilter.valueChanges.subscribe(startdate => {
    //   this.filteredValues.startdate = startdate;
    //   this.dataSource1.filter = JSON.stringify(this.filteredValues)
    // })
    // this.endDateFilter.valueChanges.subscribe(enddate => {
    //   this.filteredValues.enddate = enddate;
    //   this.dataSource1.filter = JSON.stringify(this.filteredValues)
    // })
    if (!window.localStorage.getItem('getAll')) {
      // console.log('not stored')
      this.apiService.getAPI(`getlookupsall`).subscribe((data) => {
        this.getAll = data['data']
        window.localStorage.setItem("getAll", JSON.stringify(this.getAll))
      })
    }
    else {
      // console.log('stored')
      this.getAll = JSON.parse(window.localStorage.getItem('getAll'))
    }
    // this.apiService.getAPI(`getstudent`).subscribe((data) => {
    //   this.totalStudent = data['data'].length
    // })
    // this.apiService.getAPI(`getunit`).subscribe((data) => {
    //   this.totalUnits = data['data'].length
    // })
  }
  createFilter(): (data: any, filter: string) => boolean {
    let filterFunction = function (data, filter): boolean {
      let searchTerms = JSON.parse(filter);
      return data.courseintakedateid.toString().indexOf(searchTerms.courseintakedateid) !== -1
        && (data.coursecode || '').toLowerCase().indexOf(searchTerms.coursecode.toLowerCase()) !== -1
        && (data.coursename || '').toLowerCase().indexOf(searchTerms.coursename.toLowerCase()) !== -1
        && (data.startdate || '').toLowerCase().indexOf(searchTerms.startdate.toLowerCase()) !== -1
        && (data.enddate || '').toLowerCase().indexOf(searchTerms.enddate.toLowerCase()) !== -1;
    }
    return filterFunction;
  }
  createFilter1(): (data: any, filter: string) => boolean {
    let filterFunction = function (data, filter): boolean {
      let searchTerms = JSON.parse(filter);
      return data.clientid.toLowerCase().toString().indexOf(searchTerms.clientid.toLowerCase()) !== -1
        && (data.firstname || '').toLowerCase().indexOf(searchTerms.firstname.toLowerCase()) !== -1
        && (data.email || '').toLowerCase().indexOf(searchTerms.email.toLowerCase()) !== -1;
    }
    return filterFunction;

  }
  statuscheck(row, rowID) {
    this.check = true
    this.highlighter = rowID
    this.courseName = row.coursename
    this.apiService.getAPI(`getintakecourseunitbycourseintakedateid?id=${row.courseintakedateid}`).subscribe((data) => {
      this.totalUnits = data['data'].length
    })
    this.apiService.getAPI(`getstudentbycourseintakedateid?id=${row.courseintakedateid}`).subscribe((data) => {
      this.students = data['data']

      if (this.students[0].msg == 'No record found') {
        console.log(this.students[0].msg)
        this.totalStudent = 0
        this.dataSource.data = []
      }
      else {
        this.totalStudent = this.students.length
        this.students = this.students.map(student => {
          return {
            ...student, // Copies all original properties (like id, age, etc.)
            firstname: `${student.firstname} ${student.middlename} ${student.lastname}`, // Overwrites firstname
            startdate: this.datePipe.transform(student.startdate, 'dd/MM/yyyy'), // Overwrites startdate
            enddate: this.datePipe.transform(student.enddate, 'dd/MM/yyyy') // Overwrites enddate
          };
        });
        this.dataSource = new MatTableDataSource() // create new object
        this.dataSource.data = this.students
        this.dataSource.paginator = this.tableTwoPaginator
        this.dataSource.sort = this.tableTwoSort
        this.dataSource.filterPredicate = this.createFilter1();
        this.clientIdFilter.valueChanges.subscribe(clientid => {
          this.studentFilteredValues.clientid = clientid;
          this.dataSource.filter = JSON.stringify(this.studentFilteredValues)
        })
        this.nameFilter.valueChanges.subscribe(firstname => {
          this.studentFilteredValues.firstname = firstname;
          this.dataSource.filter = JSON.stringify(this.studentFilteredValues)
        })
        this.emailFilter.valueChanges.subscribe(email => {
          this.studentFilteredValues.email = email;
          this.dataSource.filter = JSON.stringify(this.studentFilteredValues)
        })
      }
      return this.students
    })

  }
  getStudents() {
    this.apiService.getAPI('getstudentlist').subscribe((data) => {
      this.students = data['data']

      this.dashboardData = data['dashboard'] || {}
      this.courseSummary = this.dashboardData.courseSummary || []
      this.totalStudentCount = this.dashboardData.totalStudent || 0
      this.enrolledThisMonth = this.dashboardData.enrolledThisMonth || 0
      this.enrolledGrowthCount = this.dashboardData.enrolledGrowthCount || 0
      this.enrolledGrowthPercent = this.dashboardData.enrolledGrowthPercent || 0
      this.totalCertificateIssued = this.dashboardData.totalCertificateIssued || 0
      this.totalPending = this.dashboardData.totalPending || 0

      if (!this.students || this.students.length === 0 || this.students[0].msg) {
        this.totalStudent = 0
      }
      else {
        this.totalStudent = this.students.length
        for (var i in this.students) {
          this.students[i].firstname = (this.students[i].firstname || '') + ' ' + (this.students[i].lastname || '')
        }
        this.students = this.students.sort((a, b) => {
          if (a.clientid < b.clientid) {
            return 1;
          } else if (a.clientid > b.clientid) {
            return -1;
          } else {
            return 0;
          }
        });
        // this.dataSource.data = this.students // on data receive populate dataSource.data array
        // console.log('check',this.dataSource.data)
        this.dataSource = new MatTableDataSource() // create new object
        this.dataSource.data = this.students
        this.dataSource.paginator = this.tableTwoPaginator
        this.dataSource.sort = this.tableTwoSort
        this.dataSource.filterPredicate = this.createFilter1();
        this.clientIdFilter.valueChanges.subscribe(clientid => {
          this.studentFilteredValues.clientid = clientid;
          this.dataSource.filter = JSON.stringify(this.studentFilteredValues)
        })
        this.nameFilter.valueChanges.subscribe(firstname => {
          this.studentFilteredValues.firstname = firstname;
          this.dataSource.filter = JSON.stringify(this.studentFilteredValues)
        })
        this.emailFilter.valueChanges.subscribe(email => {
          this.studentFilteredValues.email = email;
          this.dataSource.filter = JSON.stringify(this.studentFilteredValues)
        })
        return data
      }
    })
  }
  getCourseIntakes() {
    this.apiService.getAPI('getcourseintakedate').subscribe((data) => {
      // console.log(data);
      this.allCourseIntakes = data['data']
      this.allCourseIntakes = this.allCourseIntakes.sort((a, b) => {
        if (a.startdate < b.startdate) {
          return 1;
        } else if (a.startdate > b.startdate) {
          return -1;
        } else {
          return 0;
        }
      });
      this.statuscheck(this.allCourseIntakes[0], 0)
      if (this.allCourseIntakes.length > 0) {
        for (let v in this.allCourseIntakes) {
          this.allCourseIntakes[v].rowID = v
        }
        this.totalCourse = this.allCourseIntakes.length
        this.dataSource1.data = this.allCourseIntakes // on data receive populate dataSource1.data array
      }

      return data
    })
  }
  refresh() {
    this.loadData()
  }
  addNew() {
    this.router.navigate(['/admin/courses/new-course-intake-date']);
  }
  public loadData() {
    this.dataSource1 = new MatTableDataSource()
    this.getCourseIntakes()
    this.dataSource1.paginator = this.paginator
    this.dataSource1.sort = this.sort
    fromEvent(this.filter.nativeElement, 'keyup').subscribe(() => {
      if (!this.dataSource1) {
        return;
      }
      this.dataSource1.filter = this.filter.nativeElement.value;
    });
  }
  editCourseIntake(id) {
    this.router.navigate([`/admin/courses/edit-course-intake-date/${id}`]);
  }
  classSchedule(id) {
    this.router.navigate([`/admin/class-schedule/class-schedule/${id}`]);
  }
  newStudentEnrollment(id) {
    this.router.navigate([`/admin/courses/new-student/${id}`])
  }
  studentDashboard(sid, id) {
    this.router.navigate([`/admin/dashboard/student-dashboard/${sid}/${id}`])

  }
  private chart1() {
    this.lineChartOptions = {
      series: [
        {
          name: 'Teacher 1',
          data: [15, 13, 30, 23, 13, 32, 27],
        },
        {
          name: 'Teacher 2',
          data: [12, 25, 14, 18, 27, 13, 21],
        },
      ],
      chart: {
        height: 270,
        type: 'line',
        foreColor: '#9aa0ac',
        dropShadow: {
          enabled: true,
          color: '#000',
          top: 18,
          left: 7,
          blur: 10,
          opacity: 0.2,
        },
        toolbar: {
          show: false,
        },
      },
      colors: ['#9F78FF', '#858585'],
      stroke: {
        curve: 'smooth',
      },
      grid: {
        row: {
          colors: ['transparent', 'transparent'], // takes an array which will be repeated on columns
          opacity: 0.5,
        },
      },
      markers: {
        size: 3,
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        title: {
          text: 'Month',
        },
      },
      yaxis: {
        min: 5,
        max: 40,
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        floating: true,
        offsetY: -25,
        offsetX: -5,
      },
      tooltip: {
        theme: 'dark',
        marker: {
          show: true,
        },
        x: {
          show: true,
        },
      },
    };
  }
}
