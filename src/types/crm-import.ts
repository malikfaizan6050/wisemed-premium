export type ImportLeadField=
    |"fullName"|"firstName"|"lastName"
    |"email"|"phone"|"alternatePhone"|"fax"|"website"
    |"organization"|"specialty"|"practiceLocation"
    |"monthlyClaims"|"monthlyCollections"
    |"callStatus"|"callDate"|"callTime"|"callRemarks"
    |"receptionistName"|"officeManagerName"
    |"authorization"|"faxConfirmed"|"willDoctorJoin"
    |"conversationSummary"|"nextAction"|"notes"|"sourceReference";
export type DuplicateStrategy="skip"|"update"|"import";

export type ImportLeadRecord = Record<ImportLeadField,string> & {
    monthlyClaims:string | number;
    monthlyCollections:string | number;
};

export interface ImportRowAnalysis {
    index:number;
    valid:boolean;
    errors:string[];
    duplicate:boolean;
    duplicateId:string | null;
    matchingFields:string[];
}

export interface ImportHistoryEntry {
    id:string;
    fileName:string;
    importedBy:string;
    importedByName:string;
    totalRecords:number;
    successfulImports:number;
    failedImports:number;
    duplicateRecords:number;
    skippedDuplicates?:number;
    createdAt:string | null;
}
