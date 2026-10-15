import { DatePipe } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ApiService } from 'src/app/api/api.service'
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS, } from '@angular/material-moment-adapter'
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core'
import { MatProgressButtonOptions } from 'mat-progress-buttons'
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-issuance-register',
  templateUrl: './issuance-register.component.html',
  styleUrls: ['./issuance-register.component.sass'],
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
export class IssuanceRegisterComponent implements OnInit {
  HFormGroup1: FormGroup
  dateValidate1 = { isError: false, errorMessage: '' }
  downloadFile
  baseApi
  isLoading = false
  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private datePipe: DatePipe
  ) { }
  spinnerButtonOptions: MatProgressButtonOptions = {
    active: false,
    text: 'Loading..',
    spinnerSize: 25,
    raised: true,
    stroked: false,
    buttonColor: 'primary',
    spinnerColor: 'accent',
    fullWidth: false,
    disabled: false,
    mode: 'indeterminate',
    buttonIcon: {
      fontIcon: 'login',
    },
  };
  ngOnInit(): void {
    this.HFormGroup1 = this.fb.group({
      certificateIssueDateFrom: ['', [Validators.required]],
      certificateIssueDateTo: ['', [Validators.required]],
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
  issuanceRegisterSubmit() {
    this.isLoading = true;
    this.spinnerButtonOptions.active = true;
    const asqaBody = this.HFormGroup1.value
    asqaBody.certificateIssueDateFrom = this.datePipe.transform(asqaBody.certificateIssueDateFrom, 'yyyy-MM-dd')
    asqaBody.certificateIssueDateTo = this.datePipe.transform(asqaBody.certificateIssueDateTo, 'yyyy-MM-dd')
    var show = document.getElementById('closebtn')
    console.log('formvalue', this.HFormGroup1.value)
    if ((this.dateValidate1.isError == false)) {
      console.log('post', asqaBody)
      this.apiService.getAPI(`getstudentenrolledreport?startdate=${asqaBody.certificateIssueDateFrom}&enddate=${asqaBody.certificateIssueDateTo}`).subscribe((data) => {
        if (!data['data'].msg) {
          this.issuanceRegisterReport(data)
        }
        else {
          this.isLoading = false;
          this.spinnerButtonOptions.active = false;
          show.style.display = 'block'
          window.scroll(0, 0)
          alert(data['data'].msg)
        }
      })
    }
    else {
      show.style.display = 'block'
      window.scroll(0, 0)
    }
  }
  // Function to get the current date in YYYYMMDD format
  getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  issuanceRegisterReport(data: any) {
    // Extract the data array from the response
    const dataArray = data.data;

    // Map the data to match the structure of the provided Excel file
    const mappedData = dataArray.map((item: any) => ({
      studentId: item.studentid?.trim(), // Trim to remove extra spaces
      firstname: item.firstname?.trim(),
      lastname: item.lastname?.trim(),
      companyName: item.companyname?.trim(),
      gender: item.gender?.trim().toUpperCase() === 'M'
      ? 'Male'
      : item.gender?.trim().toUpperCase() === 'F'
        ? 'Female'
        : item.gender?.trim() || '',
      studentEmail: item.studentemail?.trim(),
      studentEmail2: item.studentemail2?.trim(),
      studentEmail3: item.studentemail3?.trim(),
      preferredEmail: item.preferredemail?.trim(),
      preferredPhone: item.preferredphone?.trim(),
      addressLine1: item.addressline1?.trim(),
      addressLine2: item.addressline2?.trim(),
      'BuildingProperty Name': item['BuildingProperty Name']?.trim(),
      'Flat&StreetNumber&StreetName': item['Flat&StreetNumber&StreetName']?.trim(),
      suburb: item.suburb?.trim(),
      state: item.state?.trim(),
      postCode: item.postcode?.trim(),
      country: item.country?.trim(),
      isTrainee: item.istrainee?.trim(),
      enrolmentId: item.studentenrolmentid,
      'Certificate Issued': item['Certificate Issued']?.trim(),
      'Certificate Number': item['Certificate Number']?.trim(),
      'Certificate Issue Date': item['Certificate Issue Date']?.trim(),
      USI: item.usi?.trim(),
      paymentStatus: item.paymentstatus?.trim(),
      qualificationStatus: item.qualificationstatus?.trim(),
      startDate: item.startdate ? this.formatDate(item.startdate) : '', // Format date
      anticipatedCourseCompletionDate: item.anticipatedcoursecompletiondate ? this.formatDate(item.anticipatedcoursecompletiondate) : '', // Format date
      endDate: item.enddate ? this.formatDate(item.enddate) : '', // Format date
      courseCode: item.coursecode?.trim(),
      cityName: item.cityname?.trim(),
      regionName: item.regionname?.trim(),
      'Positive Outcomes': item['Positive Outcomes'],
      'Enrolled Units': item['Enrolled Units'],
      'Enrolment Date': item['Enrolment Date'] ? this.formatDate(item['Enrolment Date']) : '', // Format date
    }));

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert the mapped data to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(mappedData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Worksheet');

    // Generate a binary string from the workbook
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });

    // Convert the binary string to a Blob
    const blob = new Blob([this.s2ab(wbout)], { type: 'application/octet-stream' });

    // Get the current date in YYYYMMDD format
    const currentDate = this.getCurrentDate();

    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `EnrolmentsExport_${currentDate}.xlsx`; // Include current date in the filename
    this.isLoading = false; // Stop spinner after success
    this.spinnerButtonOptions.active = false;
    // Append the link to the body (required for Firefox)
    document.body.appendChild(link);

    // Trigger the download
    link.click();

    // Remove the link from the document
    document.body.removeChild(link);
  }

  // Utility function to convert string to ArrayBuffer
  s2ab(s: string): ArrayBuffer {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  }

  // Utility function to format date
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
