export type ImportLeadField="firstName"|"lastName"|"email"|"phone"|"organization"|"specialty"|"monthlyClaims"|"monthlyCollections";
export type DuplicateStrategy="skip"|"update"|"import";

export interface ImportLeadRecord {
    firstName:string;
    lastName:string;
    email:string;
    phone:string;
    organization:string;
    specialty:string;
    monthlyClaims:string | number;
    monthlyCollections:string | number;
}

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
    createdAt:string | null;
}
