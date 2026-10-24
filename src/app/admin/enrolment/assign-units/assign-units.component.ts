import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core'
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS, } from '@angular/material-moment-adapter'
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core'
import { DatePipe } from '@angular/common'
import { ApiService } from '../../../api/api.service'
import { StateService } from '../../../services/state.service'
import { ActivatedRoute, Router } from '@angular/router'
import { MatTableDataSource } from '@angular/material/table';
import { ReplaySubject, Subscription } from 'rxjs'
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections'
import * as _moment from 'moment';
import { default as _rollupMoment } from 'moment';
import { AddMoreUnitsComponent } from '../new-student/dialog/add-more-units/add-more-units.component'
import { MatDialog, MatDialogConfig } from "@angular/material/dialog"
const moment = _rollupMoment || _moment;
export interface allUnits {
  rowID,
  statusCheck,
  courseId,
  unitId,
  unitCode,
  unitName,
  unitType,
  vetFlag,
  AVETMISS
}
@Component({
  selector: 'app-assign-units',
  templateUrl: './assign-units.component.html',
  styleUrls: ['./assign-units.component.sass'],
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
export class AssignUnitsComponent implements OnInit {
  displayedColumns: string[] = ['rowID', 'ounitCode', 'ounitName', 'ounitType', 'ooutcomeNat', 'ostartDate', 'oendDate']
  dataSource: MatTableDataSource<allUnits>
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator
  @ViewChild(MatSort, { static: true }) sort: MatSort
  selection = new SelectionModel<allUnits>(true, []);
  selectionRadio = new SelectionModel<allUnits>(true, []);
  selectedNumbers = new ReplaySubject<number[]>(1);
  bulkUnitType
  bulkVetFlag
  bulkAVETMISS
  setUnitTypeVal = []
  setVetFlagVal = []
  setAVETMISSVal = []
  HFormGroup1
  HFormGroup2
  enrolmentID: any
  defaultStartDate:any
  defaultEndDate:any
  userInfo: any
  courseIntakeDateId: any
  courseId: any
  units: any
  isInitialSelectionDone = false;
  outcomenational: any
  trainingData
  outcome
  stDate
  error: any = { isError: false, errorMessage: '' };
  enDate
  studentData: any
  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private datePipe: DatePipe,
    private state: StateService,
    public dialog: MatDialog,
    private actRoute: ActivatedRoute,
    private router: Router
  ) {
    this.enrolmentID = this.actRoute.snapshot.params.id;
    this.getUnits(this.enrolmentID)
  }

  ngOnInit(): void {
    this.userInfo = JSON.parse(localStorage.getItem('currentUser'))
    this.dataSource = new MatTableDataSource() // create new object
    this.dataSource.paginator = this.paginator
    this.dataSource.sort = this.sort
    this.HFormGroup1 = this.fb.group({
      userId: [this.userInfo.userid],
      studentEnrolmentId: [this.enrolmentID],
      Rows: this.fb.array([this.newTAarrays()]),
    })
    this.HFormGroup2 = this.fb.group({
      userId: [this.userInfo.userid],
      studentEnrolmentId: [this.enrolmentID],
      trainingArray: this.fb.array([this.newTAarrays()]),
    })
    this.apiService.getAPI('getoutcomenational').subscribe((data) => {
      this.outcomenational = data['data']
    })
  }
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }
  masterToggle() {
    if (!this.isInitialSelectionDone) {
      // Initially select only rows where statuscheck === 1
      this.dataSource.data.forEach(row => {
        if (row.statusCheck === 1) {
          this.selection.select(row);
        }
      });
      this.isInitialSelectionDone = true; // Mark initial selection as done
    } else {
      this.isAllSelected() ?
        this.selection.clear() :
        this.dataSource.data.forEach(row => this.selection.select(row));
    }
  }
  sendSelectedNumbers() {
    let selectedNumbers: number[] = [];
    for (let item of this.selection.selected) {
      selectedNumbers.push(item.rowID)
    }
    return selectedNumbers;
  }
  getUnits(id) {
    this.apiService.getAPI(`getstudentenrolmentbystudentenrolmentid?id=${id}`).subscribe((data) => {
      this.studentData = data['data'][0]
      this.courseId = data['data'][0].courseid
      this.defaultStartDate = data['data'][0].commencementdate
      this.defaultEndDate = data['data'][0].expectedcompletiondate
      this.stDate = this.defaultStartDate ? moment(new Date(this.defaultStartDate)) : null;
      this.enDate = this.defaultEndDate ? moment(new Date(this.defaultEndDate)) : null;
      this.courseIntakeDateId = data['data'][0].courseintakedateid
      this.apiService.getAPI(`getcourseunitbycourseid?id=${this.courseId}`).subscribe((data) => {
        this.apiService.getAPI(`gettrainingactivity?id=${id}`).subscribe((data1) => {
          this.trainingData = Array.isArray(data1['data']) ? data1['data'] : [];
          if (this.trainingData) {
            this.units = data['data']
            let unitBody = data['data'];
            unitBody.sort((a, b) => {
              if (a.unitorderby < b.unitorderby) {
                return -1;
              }
              if (a.unitorderby > b.unitorderby) {
                return 1;
              }
              return 0;
            });
            const rows = this.HFormGroup1.get('Rows') as FormArray;
            while (rows.length) {
              rows.removeAt(0);
            }

            const calculatedUnitDates = this.getCalculatedUnitDates(unitBody);

            unitBody.forEach((unit, index) => {
              let matchingTraining = this.trainingData.find(t => t.unitid === unit.unitid) || {};
              const calculatedDates = calculatedUnitDates.get(unit.unitid);

              let rowData = this.fb.group({
                rowID: index,
                trainingActivityId: matchingTraining.trainingactivityid || '',
                statusCheck: matchingTraining.statuscheck ? 1 : 0,
                unitId: unit.unitid,
                unitCode: unit.unitcode,
                unitName: unit.unitname,
                unitType: unit.unittype,
                vetFlag: unit.vetflag,
                AVETMISS: unit.avetmiss,
                classSetupId: matchingTraining.classsetupid || null,
                outcomeNationalId: matchingTraining.outcomenationalid || 9,
                outcomeTrainingOrgId: matchingTraining.outcomenationalid || 9,
                startDate: matchingTraining.startdate ? moment(matchingTraining.startdate) : (calculatedDates ? calculatedDates.startDate : this.stDate),
                endDate: matchingTraining.enddate ? moment(matchingTraining.enddate) : (calculatedDates ? calculatedDates.endDate : this.enDate),
                // startDate: this.datePipe.transform(matchingTraining.startdate || null, 'yyyy-MM-dd'),
                // endDate: this.datePipe.transform(matchingTraining.enddate, 'yyyy-MM-dd'),
                hoursAttended: matchingTraining.hoursattended || unit.schedulednominalhours
              });

              rows.push(rowData);
            });

            console.log(this.HFormGroup1.value);
            this.dataSource = new MatTableDataSource(this.Rows.value);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.masterToggle();
          }
          else {
            let unitBody = data['data'];
            unitBody.sort((a, b) => {
              if (a.unitorderby < b.unitorderby) {
                return -1;
              }
              if (a.unitorderby > b.unitorderby) {
                return 1;
              }
              return 0;
            });
            const rows = this.HFormGroup1.get('Rows') as FormArray;
            while (rows.length) {
              rows.removeAt(0);
            }

            unitBody.forEach((unit, index) => {

              let rowData = this.fb.group({
                rowID: index,
                trainingActivityId: '',
                statusCheck: 0,
                unitId: unit.unitid,
                unitCode: unit.unitcode,
                unitName: unit.unitname,
                unitType: unit.unittype,
                vetFlag: unit.vetflag,
                AVETMISS: unit.avetmiss,
                classSetupId: null,
                outcomeNationalId: 9,
                outcomeTrainingOrgId: 9,
                startDate: this.datePipe.transform(this.studentData.commencementdate, 'yyyy-MM-dd'),
                endDate: this.datePipe.transform(this.studentData.expectedcompletiondate, 'yyyy-MM-dd'),
                // startDate: this.datePipe.transform(this.studentData.commencementdate, 'yyyy-MM-dd'),
                // endDate: this.datePipe.transform(this.studentData.expectedcompletiondate, 'yyyy-MM-dd'),
                hoursAttended: unit.schedulednominalhours
              });

              rows.push(rowData);
            });

            console.log(this.HFormGroup1.value);
            this.dataSource = new MatTableDataSource(this.Rows.value);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.masterToggle();
          }
        })
      })
    })
  }
  outComeChange(val) {
    console.log(val)
    for (let i = 0; i < this.Rows.length; i++) {
      ((this.HFormGroup1.get('Rows') as FormArray).at(i) as FormGroup).get('outcomeNationalId').patchValue(val);
    }
  }
  sDateChange(val) {
    for (let i = 0; i < this.Rows.length; i++) {
      ((this.HFormGroup1.get('Rows') as FormArray).at(i) as FormGroup).get('startDate').patchValue(moment(val));
    }
  }
  eDateChange(val) {
    this.error = { isError: false, errorMessage: '' }
    for (let i = 0; i < this.Rows.length; i++) {
      ((this.HFormGroup1.get('Rows') as FormArray).at(i) as FormGroup).get('endDate').patchValue(moment(val));
    }
  }
  get Rows(): FormArray {
    return this.HFormGroup1.get("Rows") as FormArray
  }
  getCalculatedUnitDates(units) {
    const calculatedDates = new Map();
    let previousEndDate = null;

    units.forEach((unit) => {
      const unitDuration = Number(unit.unitduration);

      // Units without a duration retain the existing enrolment-wide date logic.
      if (!(unitDuration > 0) || !this.stDate) {
        return;
      }

      const durationInDays = unit.unitdurationtype === 'W' ? unitDuration * 7 : unitDuration;
      const startDate = previousEndDate ? previousEndDate.clone().add(1, 'day') : this.stDate.clone();
      const endDate = startDate.clone().add(durationInDays - 1, 'day');

      calculatedDates.set(unit.unitid, { startDate, endDate });
      previousEndDate = endDate;
    });

    return calculatedDates;
  }
  newTAarrays() {
    return this.fb.group({
      trainingActivityId: '',
      statusCheck: 1,
      unitId: '',
      unitCode: '',
      unitName: '',
      unitType: '',
      vetFlag: '',
      AVETMISS: '',
      classSetupId: '',
      outcomeNationalId: 9,
      outcomeTrainingOrgId: '',
      startDate: '',
      endDate: '',
      hoursAttended: ''
    })
  }
  UnitBulkSet() {
    for (let i = 0; i < this.Rows.length; i++) {
      if (this.bulkUnitType == 'C') {
        this.Rows.at(i).value.unitType = 'C'
        this.setUnitTypeVal[i] = 'C';
        ((this.HFormGroup1.get('Rows') as FormArray).at(this.Rows.at(i).value.rowID) as FormGroup).get('unitType').patchValue(this.setUnitTypeVal[i])
      }
      if (this.bulkUnitType == 'E') {
        this.Rows.at(i).value.unitType = 'E'
        this.setUnitTypeVal[i] = 'E';
        ((this.HFormGroup1.get('Rows') as FormArray).at(this.Rows.at(i).value.rowID) as FormGroup).get('unitType').patchValue(this.setUnitTypeVal[i])
      }
    }
  }
  UnitRowChange(event) {
    let rid = parseInt(event.target.getAttribute('data-rowid'));
    let rVal = event.target.getAttribute('value')
    this.setUnitTypeVal[rid] = rVal;
    ((this.HFormGroup1.get('Rows') as FormArray).at(rid) as FormGroup).get('unitType').patchValue(rVal)
  }
  vetFlagBulkSet() {
    for (let i = 0; i < this.Rows.length; i++) {
      if (this.bulkVetFlag == 'Y') {
        this.Rows.at(i).value.vetFlag = 'Y'
        this.setVetFlagVal[i] = 'Y';
        ((this.HFormGroup1.get('Rows') as FormArray).at(this.Rows.at(i).value.rowID) as FormGroup).get('vetFlag').patchValue(this.setVetFlagVal[i])
      }
      if (this.bulkVetFlag == 'N') {
        this.Rows.at(i).value.vetFlag = 'N'
        this.setVetFlagVal[i] = 'N';
        ((this.HFormGroup1.get('Rows') as FormArray).at(this.Rows.at(i).value.rowID) as FormGroup).get('vetFlag').patchValue(this.setVetFlagVal[i])
      }
    }
  }
  vetFlagRowChange(event) {
    let rid = parseInt(event.target.getAttribute('data-rowid'));
    let rVal = event.target.getAttribute('value')
    this.setVetFlagVal[rid] = rVal;
    ((this.HFormGroup1.get('Rows') as FormArray).at(rid) as FormGroup).get('vetFlag').patchValue(rVal)
  }
  AVETMISSBulkSet() {
    for (let i = 0; i < this.Rows.length; i++) {
      if (this.bulkAVETMISS == 'Y') {
        this.Rows.at(i).value.AVETMISS = 'Y'
        this.setAVETMISSVal[i] = 'Y';
        ((this.HFormGroup1.get('Rows') as FormArray).at(this.Rows.at(i).value.rowID) as FormGroup).get('AVETMISS ').patchValue(this.setAVETMISSVal[i])
      }
      if (this.bulkAVETMISS == 'N') {
        this.Rows.at(i).value.AVETMISS = 'N'
        this.setAVETMISSVal[i] = 'N';
        ((this.HFormGroup1.get('Rows') as FormArray).at(this.Rows.at(i).value.rowID) as FormGroup).get('AVETMISS ').patchValue(this.setAVETMISSVal[i])
      }
    }
  }
  AVETMISSRowChange(event) {
    let rid = parseInt(event.target.getAttribute('data-rowid'));
    let rVal = event.target.getAttribute('value')
    this.setAVETMISSVal[rid] = rVal;
    ((this.HFormGroup1.get('Rows') as FormArray).at(rid) as FormGroup).get('AVETMISS ').patchValue(rVal)
  }
  onAddTrainingActivity() {
    // Sync every row's statusCheck with its checkbox: checked = 1, unchecked = 0
    const selectedRowIds = new Set(this.selection.selected.map(row => row.rowID));
    this.Rows.controls.forEach(ctrl => {
      const isChecked = selectedRowIds.has(ctrl.get('rowID')?.value);
      ctrl.get('statusCheck').setValue(isChecked ? 1 : 0);
    });

    const allRows = this.Rows.getRawValue();

    if (this.trainingData) {
      // Checked rows go with statusCheck = 1.
      // Previously saved rows that are now unchecked go with statusCheck = 0.
      // Unchecked rows that were never saved (no trainingActivityId) are skipped,
      // so they don't get created in the database.
      const editTraning = allRows.filter(row => row.statusCheck === 1 || row.trainingActivityId);
      console.log('data', editTraning);

      const trainingArray = this.HFormGroup2.get('trainingArray') as FormArray;
      trainingArray.clear();
      editTraning.forEach(row => {
        trainingArray.push(this.fb.group({
          trainingActivityId: row.trainingActivityId,
          statusCheck: row.statusCheck,
          unitId: row.unitId,
          unitName: row.unitName,
          classSetupId: row.classSetupId,
          outcomeNationalId: row.outcomeNationalId,
          outcomeTrainingOrgId: row.outcomeNationalId,
          startDate: this.datePipe.transform(row.startDate, 'yyyy-MM-dd'),
          endDate: this.datePipe.transform(row.endDate, 'yyyy-MM-dd'),
          hoursAttended: row.hoursAttended,
          unitCode: row.unitCode,
          unitType: row.unitType,
          vetFlag: row.vetFlag,
          AVETMISS: row.AVETMISS
        }));
      });
      console.log('finalcheck', this.HFormGroup2.value)
      this.apiService.postAPI(`edittrainingactivity?id=${this.enrolmentID}`, this.HFormGroup2.value).subscribe((data) => {
        this.router.navigate(['/admin/enrolment/all-student'])
      })
    }
    else {
      const payload = {
        ...this.HFormGroup1.getRawValue(),
        Rows: allRows.filter(row => row.statusCheck === 1)
      };
      this.apiService.postAPI('addtrainingactivity', payload).subscribe((data) => {
        this.router.navigate(['/admin/enrolment/all-student'])
      })
    }
  }
  // Rebuilds the table from the form rows while keeping the current checkbox selection.
  // SelectionModel compares by object reference, so selected rows must be re-mapped
  // onto the new row objects, matched by rowID.
  private refreshTable(extraSelectedRowIds: number[] = []) {
    const selectedRowIds = new Set([
      ...this.selection.selected.map(row => row.rowID),
      ...extraSelectedRowIds
    ]);
    this.dataSource = new MatTableDataSource(this.Rows.value);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.selection.clear();
    this.dataSource.data.forEach(row => {
      if (selectedRowIds.has(row.rowID)) {
        this.selection.select(row);
      }
    });
  }
  addMoreUnits() {
    let tempDirection;
    if (localStorage.getItem('isRtl') === 'true') {
      tempDirection = 'rtl';
    } else {
      tempDirection = 'ltr';
    }
    const dialogRef = this.dialog.open(AddMoreUnitsComponent, {
      data: { units: this.units, courseIntakeDateID: this.courseIntakeDateId, courseId: this.courseId, unitArray: this.Rows.value },
      direction: tempDirection,
    });
    dialogRef.afterClosed().subscribe((data: any) => {
      if (data && data.length > 0) {
        const newRowIds: number[] = [];
        // Start after the existing rows so rowIDs stay unique even if units are added more than once
        const startIndex = this.Rows.length;
        data.forEach((unit, k) => {
          const rowID = startIndex + k;
          newRowIds.push(rowID);
          let rowData1 = this.fb.group({
            rowID: rowID,
            trainingActivityId: '',
            statusCheck: 0,
            unitId: unit.unitid,
            unitCode: unit.unitcode,
            unitName: unit.unitname,
            unitType: 'C',
            vetFlag: 'Y',
            AVETMISS: 'Y',
            classSetupId: null,
            outcomeNationalId: 9,
            outcomeTrainingOrgId: null,
            startDate: this.datePipe.transform(unit.startdate, 'yyyy-MM-dd'),
            endDate: this.datePipe.transform(unit.enddate, 'yyyy-MM-dd'),
            hoursAttended: unit.hoursattended
          });
          (this.HFormGroup1.get('Rows') as FormArray).push(rowData1)
        });
        // Keep the user's existing checks and tick the newly added units
        this.refreshTable(newRowIds);
      }
    });
  }
}