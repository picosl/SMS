import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { StudentsService } from "./students.service";
import { HttpClient } from "@angular/common/http";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { fromEvent } from "rxjs";
import { MatMenuTrigger } from "@angular/material/menu";
import { MatTableDataSource } from "@angular/material/table";
import { ApiService } from "../../../api/api.service";
import { FormControl } from "@angular/forms";
import { StudentDialogComponent } from "./dialogs/student-dialog/student-dialog.component";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import * as _moment from "moment";
import { default as _rollupMoment } from "moment";
import { map, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from "@angular/material/core";
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MAT_MOMENT_DATE_FORMATS,
  MomentDateAdapter,
} from "@angular/material-moment-adapter";
const moment = _rollupMoment || _moment;
export interface Students {
  // highlighted?: boolean
  clientId: string;
  fullName: string;
  email: string;
  courseName: string;
  className: string;
  startDate: Date;
  endDate: Date;
  enroledStatus: string;
  expectedCompletionDate: Date;
  actions;
}
export interface EnrolledCourses {
  courseName: string;
  startDate: string;
  endDate: string;
  actions;
}
@Component({
  selector: "app-all-student",
  templateUrl: "./all-student.component.html",
  styleUrls: ["./all-student.component.sass"],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: "en-GB" },
    DatePipe,
  ],
})
export class AllStudentComponent implements OnInit {
  mode = new FormControl("side");
  students;
  isLoading = true;
  displayedColumns: string[] = [
    "clientId",
    "fullName",
    "courseName",
    "className",
    "enrolDate",
    "enroledStatus",
    "expectedCompletionDate",
    "actions",
  ];
  dataSource: MatTableDataSource<Students>;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild("filter", { static: true }) filter: ElementRef;

  courseIntakeFilter = new FormControl();
  bulkAgentFilter = new FormControl();
  bulkClientIdFilter = new FormControl();
  bulkApplicationStatusFilter = new FormControl();
  agentFilter = new FormControl();
  usiFilter = new FormControl();
  classFilter = new FormControl();
  studentNameFilter = new FormControl();
  clientIdFilter = new FormControl("");
  firstNameFilter = new FormControl("");
  lastNameFilter = new FormControl("");
  emailFilter = new FormControl("");
  courseCodeFilter = new FormControl("");
  courseNameFilter = new FormControl("");
  startDateFilter = new FormControl("");
  endDateFilter = new FormControl("");
  statusFilter = new FormControl("");
  enrolmentDateFilter = new FormControl("");
  classNameFilter = new FormControl("");
  expectedCompletionDateFilter = new FormControl("");
  Did = environment.magicNumber
  showDomesticBadge = false;
  
  filteredValues = {
    courseIntakeDateId: "",
    clientid: "",
    fullname: "",
    email: "",
    coursename: "",
    startdate: "",
    enddate: "",
    classname: "",
    commencementdate: "",
    applicationstatusname: "",
    expectedcompletiondate: "",
  };
  allCourseIntakeDate;
  courseIntakeDateId = "";
  clientId = "";
  firstName = "";
  lastName = "";
  email = "";
  courseCode = "";
  courseName = "";
  startDate = "";
  endDate = "";
  dataString;

  displayedColumns2: string[] = [
    "courseName",
    "startDate",
    "endDate",
    "actions",
  ];
  dataSource2: MatTableDataSource<EnrolledCourses>;
  studentId;
  enrolledCourses;

  checkngIF = false;
  @ViewChild(MatPaginator, { static: true }) paginator2: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort2: MatSort;
  @ViewChild("filter", { static: true }) filter2: ElementRef;
  @ViewChild(MatMenuTrigger)
  highlighter = 0;
  userInfo: any;
  allAgents: any;
  agentId: any;
  allApplicationStatus: any;
  getAll: any;
  errorsReq: any = { isError: false, errorMessage: '' };

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public studentsService: StudentsService,
    private apiService: ApiService,
    private datePipe: DatePipe,
    private router: Router
  ) {
    this.getStudents();
  }

  changeValue(value: any) {
    this.courseIntakeDateId = value;
    // console.log('exp',value)
  }
  changeAgentValue(value: any) {
    this.agentId = value;
  }
  ngOnInit() {
    this.userInfo = JSON.parse(localStorage.getItem("currentUser"));
    this.getAll = JSON.parse(window.localStorage.getItem('getAll'))
    // this.showDomesticBadge = Number(this.Did) === 13 ;
    this.showDomesticBadge = Number(this.Did) === 13 || Number(this.Did) === 38;
    console.log('showDomesticBadge', this.showDomesticBadge, 'Did', this.Did)
    this.allApplicationStatus = this.getAll[0].ApplicationStatus
    this.allApplicationStatus.push({
      applicationstatusname: "All",
      applicationstatusid: 100
    })
    this.dataSource = new MatTableDataSource(); // create new object
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    //Filtering
    this.apiService.getAPI("getcourse").subscribe((data) => {
      this.allCourseIntakeDate = data["data"];
      this.allCourseIntakeDate.push({
        courseid: 100,
        coursename: "All"
      })
    });
    this.apiService.getAPI("getagent").subscribe((data) => {
      this.allAgents = data["data"];
      this.allAgents.push({
        agencyname: "All",
        agentid: 100
      });
      console.log(this.allAgents)

    });
    //this.courseIntakeFilter.setValue('id')
    // console.log(this.courseIntakeFilter.value)
    this.courseIntakeFilter.valueChanges.subscribe((courseIntakeDateId) => {
      this.filteredValues.courseIntakeDateId = courseIntakeDateId;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.dataSource.filterPredicate = this.createFilter();

    this.clientIdFilter.valueChanges.subscribe((clientid) => {
      this.filteredValues.clientid = clientid;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.firstNameFilter.valueChanges.subscribe((fullName) => {
      this.filteredValues.fullname = fullName;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    // this.lastNameFilter.valueChanges.subscribe(lastName => {
    //   this.filteredValues.lastname = lastName;
    //   this.dataSource.filter = JSON.stringify(this.filteredValues)
    // })
    // this.emailFilter.valueChanges.subscribe(email => {
    //   this.filteredValues.email = email;
    //   this.dataSource.filter = JSON.stringify(this.filteredValues)
    // })
    // this.courseCodeFilter.valueChanges.subscribe(courseCode =>{
    //   this.filteredValues.coursecode = courseCode;
    //   this.dataSource.filter = JSON.stringify(this.filteredValues)
    // })
    this.courseNameFilter.valueChanges.subscribe((courseName) => {
      this.filteredValues.coursename = courseName;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.classNameFilter.valueChanges.subscribe((className) => {
      this.filteredValues.classname = className;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.enrolmentDateFilter.valueChanges.subscribe((commencementDate) => {
      this.filteredValues.commencementdate = commencementDate;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.statusFilter.valueChanges.subscribe((applicationStatusName) => {
      this.filteredValues.applicationstatusname = applicationStatusName;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.expectedCompletionDateFilter.valueChanges.subscribe(
      (expectedCompletionDate) => {
        this.filteredValues.expectedcompletiondate = expectedCompletionDate;
        this.dataSource.filter = JSON.stringify(this.filteredValues);
      }
    );
  }
  private addDomesticBadge(student: any): any {
    if (!this.showDomesticBadge) {
      return {
        ...student,
        studentTypeBadge: '',
        studentTypeTitle: '',
        studentTypeClass: ''
      };
    }

    const domesticValue = (student.domesticstudent ?? '').toString().trim().toLowerCase();

    if (!domesticValue) {
      return {
        ...student,
        studentTypeBadge: '',
        studentTypeTitle: '',
        studentTypeClass: ''
      };
    }

    const isDomestic = domesticValue === 'yes';

    return {
      ...student,
      studentTypeBadge: isDomestic ? 'D' : 'I',
      studentTypeTitle: isDomestic ? 'Domestic Student' : 'International Student',
      studentTypeClass: isDomestic ? 'domestic-badge' : 'international-badge'
    };
  }
  getStudents() {
    // 2. Set loading to TRUE right before the call
    this.isLoading = true;

    const dateLocale = 'en-GB';
    let sqlquery = ["a.studentid,a.clientid,a.firstname, a.lastname, a.coursecode, a.coursename, a.classname,a.commencementdate,a.expectedcompletiondate,a.applicationstatusname,a.studentenrolmentid,a.email, a.altemail"];
    
    // console.log("did", this.Did, 'type', typeof(this.Did))
    if (this.Did == '13'){
      sqlquery = ["a.studentid,a.clientid,a.firstname, a.lastname, a.coursecode, a.coursename, a.classname,a.commencementdate,a.expectedcompletiondate,a.applicationstatusname,a.studentenrolmentid,a.email,a.altemail,a.domesticstudent"];

    }

    this.apiService.getAPI(`getstudent?sqlquery=${sqlquery}`).pipe(

      // Your existing map operator (unchanged)
      map(data => {
        const students = data["data"];
        const processedStudents = students.map(student => {
          // ... (all your date formatting and fullname logic)
          // ... (Bug Fix: Use student.commencementdate, not student.startdate)
          let formattedStartDate = '';
          let formattedEndDate = '';

          if (student.commencementdate) {
            formattedStartDate = new Date(student.commencementdate).toLocaleDateString(dateLocale);
          }
          if (student.expectedcompletiondate) {
            formattedEndDate = new Date(student.expectedcompletiondate).toLocaleDateString(dateLocale);
          }

          return this.addDomesticBadge({
            ...student,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            fullname: `${student.firstname} ${student.lastname}`,
            coursename: student.coursename == null ? "" : student.coursename
          });
        });

        // ... (your sort logic)
        processedStudents.sort((a, b) => {
          if (a.clientid > b.clientid) return -1;
          if (a.clientid < b.clientid) return 1;
          const dateA = a.commencementdate ? new Date(a.commencementdate).getTime() : 0;
          const dateB = b.commencementdate ? new Date(b.commencementdate).getTime() : 0;
          return (dateA || 0) - (dateB || 0);
        });

        return processedStudents;
      }),

      // 3. Add finalize() to set loading to FALSE when done
      finalize(() => {
        this.isLoading = false;
      })

    ).subscribe({
      next: (processedStudents) => {
        this.students = processedStudents;
        this.dataSource.data = this.students;
      },
      error: (err) => {
        console.error("Failed to get students:", err);
        // No need to set isLoading = false here, finalize() handles it!
      }
    });
  }
  createFilter(): (data: any, filter: string) => boolean {
    let filterFunction = function (data, filter): boolean {
      let searchTerms = JSON.parse(filter);
      return (
        data.clientid
          .toLowerCase()
          .toString()
          .indexOf(searchTerms.clientid.toLowerCase()) !== -1 &&
        (data.fullname || "")
          .toLowerCase()
          .indexOf(searchTerms.fullname.toLowerCase()) !== -1 &&
        data.email
          .toLowerCase()
          .toLowerCase()
          .indexOf(searchTerms.email.toLowerCase()) !== -1 &&
        (data.coursename || "")
          .toLowerCase()
          .indexOf(searchTerms.coursename.toLowerCase()) !== -1 &&
        (data.classname || "")
          .toLowerCase()
          .indexOf(searchTerms.classname.toLowerCase()) !== -1 &&
        (data.commencementdate || "")
          .toLowerCase()
          .indexOf(searchTerms.commencementdate.toLowerCase()) !== -1 &&
        (data.applicationstatusname || "")
          .toLowerCase()
          .indexOf(searchTerms.applicationstatusname.toLowerCase()) !== -1 &&
        (data.expectedcompletiondate || "")
          .toLowerCase()
          .indexOf(searchTerms.expectedcompletiondate.toLowerCase()) !== -1
      );
    };
    return filterFunction;
  }
  search(cid: any, aid: any, asid: any, clid: any, uid: any, name: any, email: any, classname: any) {
    let queryParams = [];
    let sqlquery = ["a.studentid,a.clientid,a.firstname, a.lastname, a.coursecode, a.coursename, a.classname,a.commencementdate,a.expectedcompletiondate,a.applicationstatusname,a.studentenrolmentid,a.email,a.altemail"];
    if (this.Did == '13'){
      sqlquery = ["a.studentid,a.clientid,a.firstname, a.lastname, a.coursecode, a.coursename, a.classname,a.commencementdate,a.expectedcompletiondate,a.applicationstatusname,a.studentenrolmentid,a.email,a.altemail,a.domesticstudent"];

    }
    // Build query string... (all your 'if' blocks remain the same)
    if (cid && cid != 100) {
      queryParams.push(`courseid=${cid}`);
    }
    if (aid && aid != 100) {
      queryParams.push(`agentid=${aid}`);
    }
    if (asid && asid != 100) {
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
    if (classname) {
      queryParams.push(`classname=${classname}`);
    }
    queryParams.push(`sqlquery=${sqlquery}`);
    console.log(queryParams);

    // If there are any query parameters, make the API call
    if (queryParams.length > 0) {
      const queryString = queryParams.join('&');

      // <-- 1. Set loading to TRUE -->
      this.isLoading = true;

      this.apiService.getAPI(`getstudent?${queryString}`).pipe(
        // <-- 2. Add finalize to set loading to FALSE when done -->
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe({ // <-- 3. Use object-based subscribe -->
        next: (data) => {
          // I moved this declaration up to fix a scope issue
          var show = document.getElementById('closebtn');

          if (data['data'].msg) {
            this.errorsReq = { isError: true, errorMessage: data['data'].msg };
            this.dataSource.data = [];
          }
          else {
            let students = data['data'];

            // Your existing logic (a .map() would be more modern here)
            for (let i in students) {
              students[i] = this.addDomesticBadge({
                ...students[i],
                fullname: students[i].firstname + " " + students[i].lastname
              });
            }

            this.dataSource.data = students;
            this.students = students;
          }

          if (show) {
            show.style.display = 'block';
          }
          // 'return data' is not needed inside a subscribe block
        },
        // <-- 4. Add error handling -->
        error: (err) => {
          console.error("Search failed:", err);
          this.errorsReq = { isError: true, errorMessage: "An error occurred during the search." };
          this.dataSource.data = []; // Clear data on error
        }
      });
    }
    else {
      // This function already handles its own loading state!
      this.getStudents();
    }
  }
  searchByAgent() {
    if (this.agentFilter.value > 0) {
      let id = this.agentId;
      this.apiService.getAPI(`getstudent?agentid=${id}`).subscribe((data) => {
        console.log("data", data);
        this.students = data["data"];
        for (var i in this.students) {
          this.students[i].startDate = this.datePipe.transform(
            this.students[i].startdate,
            "dd/MM/yyyy"
          );
          this.students[i].endDate = this.datePipe.transform(
            this.students[i].enddate,
            "dd/MM/yyyy"
          );
          this.students[i].coursename =
            this.students[i].coursecode + " - " + this.students[i].coursename;
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
        this.dataSource.data = this.students;
      });
    }
  }
  showInfo(row) {
    let tempDirection;
    if (localStorage.getItem("isRtl") === "true") {
      tempDirection = "rtl";
    } else {
      tempDirection = "ltr";
    }
    const dialogRef = this.dialog.open(StudentDialogComponent, {
      data: { student_Id: row.studentid },
      direction: tempDirection,
    });
  }
  refresh() {
    this.loadData();
  }
  addNew() {
    this.router.navigate(["/admin/enrolment/new-student"]);
  }
  public loadData() {
    this.dataSource = new MatTableDataSource(); // create new object
    this.getStudents();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    fromEvent(this.filter.nativeElement, "keyup").subscribe(() => {
      if (!this.dataSource) {
        return;
      }
      this.dataSource.filter = this.filter.nativeElement.value;
    });
  }
  taskClick(i, id, nav: any): void {
    nav.open();
    window.scroll(0, 0);
    this.highlighter = i;
    console.log(i);
    this.studentId = id;
    this.apiService
      .getAPI(`getstudentenrolmentbystudentid?id=${this.studentId}`)
      .subscribe((data) => {
        console.log(data);
        this.enrolledCourses = data["data"];
        setTimeout(() => {
          if (this.enrolledCourses) {
            this.highlighter = i;
          }
        }, 0);
      });

    console.log(this.highlighter);
  }
  closeSlider(nav: any) {
    if (nav.open()) {
      nav.close();
    }
    this.highlighter = -1;
    console.log(this.highlighter);
  }
  // View Enrolled Courses
  getEnrolledCourses() {
    this.apiService
      .getAPI(`getstudentenrolmentbystudentid?id=${this.studentId}`)
      .subscribe((data) => {
        //console.log(data);
        this.enrolledCourses = data["data"];
      });
  }
  newMessage(firstName, id) {
    this.router.navigate([
      `/admin/communication/sent-email/${firstName}/${id}`,
    ]);
  }
  editStudent(row) {
    if (row.studentenrolmentid == null) {
      var step = "P";
      this.router.navigate([
        `/admin/enrolment/edit-student/${step}/${row.studentid}`,
      ]);
    } else {
      var step = "S";
      this.router.navigate([
        `/admin/enrolment/edit-student/${step}/${row.studentenrolmentid}`,
      ]);
    }
  }
  editEnrCourse(id) {
    var step = "C";
    this.router.navigate([`/admin/enrolment/edit-student/${step}/${id}`]);
  }
  addEnrCourse(id) {
    this.router.navigate([`/admin/enrolment/new-student/enrol-course/${id}`]);
  }
  deleteStudent(enrolid, sid) {
    let step = "E";
    if (enrolid) {
      this.router.navigate([
        `/admin/enrolment/unenroll-student/${step}/${enrolid}`,
      ]);
    } else {
      step = "S";
      this.router.navigate([
        `/admin/enrolment/unenroll-student/${step}/${sid}`,
      ]);
    }
  }
  paymentSchedule(id) {
    this.router.navigate([`/admin/enrolment/student-payment-schedule/${id}`]);
  }
  invoice(id) {
    console.log(id);
    this.router.navigate([`/admin/finance/invoice/${id}`]);
  }
  classAsign(ecd, cd, id) {
    this.router.navigate([`/admin/enrolment/asign-class/${ecd}/${cd}/${id}`]);
  }
  downloadOfferLetter(data) {
    console.log(data);
    if (data.applicationstatusname == "Cancelled") {
      window.open(
        `https://api.wonderit.com.au:8000/report/offer_letter_by_enrolmentid?inst_id=${this.userInfo.college_id}&sid=${data.studentenrolmentid}`
      );
    }
    else {
      window.open(
        `https://api.wonderit.com.au:8000/report/offer_letter?inst_id=${this.userInfo.college_id}&sid=${data.studentid}`
      );
    }
  }
  assignUnits(id) {
    this.router.navigate([`/admin/enrolment/assign-units/${id}`]);
  }
  testByMazhar() {
    console.log('test', this.students)
    const title = 'Students List';
    const headers = [
      "Client Id",
      "Name",
      "Course Code",
      "Course Name",
      "Class Name",
      "Email",
      "Alt.Email",
      "Commencement Date",
      "Expected Completion Date",
      "Enrollment Status",
    ];
    const data = this.students.map(student => [
      student.clientid,
      student.fullname,
      student.coursecode,
      student.coursename,
      student.classname,
      student.email,
      student.altemail,
      student.commencementdate,
      student.expectedcompletiondate,
      student.applicationstatusname
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    const titleRow = worksheet.addRow([title]);
    titleRow.font = {
      family: 4,
      size: 16,
      bold: true
    };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells('A1:J2');
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell, number) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.font = {
        family: 4,
        size: 12,
        bold: true,
        color: { argb: 'FFFFFFFF' } // White font color
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF000000' } // Black background color
      };
    });
    worksheet.autoFilter = {
      from: 'A3', // Starting cell of the header row
      to: 'J3'    // Ending cell of the header row (adjust based on your last column)
    };
    data.forEach(d => {
      const row = worksheet.addRow(d);
      const qty = row.getCell(5);

    });
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    worksheet.getColumn(1).width = 13
    worksheet.getColumn(2).width = 17;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 45;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 28;
    worksheet.getColumn(7).width = 25;
    worksheet.getColumn(8).width = 25;
    worksheet.getColumn(9).width = 28;
    worksheet.getColumn(10).width = 20;

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs.saveAs(blob, 'Students List.xlsx');
    });
  }
}
