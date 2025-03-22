// Add this new interface for grouped course pools
export interface GroupedCoursePool {
  UE: UE;
  Type: string;
  Volume: number;
  GroupIds: number[];
}

export type User = {
    Id: number;
    FirstName: string;
    LastName: string;
    Password: string;
    Role: string;
};

// Removed obsolete Context type & Room type

export type Trame = {
    Id: number;
    Name: string;
    Owner: number;
    StartDate: Date;
    EndDate: Date;
};

export type Layer = {
    Id: number;
    Name: string;
    TrameId: number;
    Color: string;
};

export type Prof = {
    Id: number;
    FullName: string;
    Status: string;
    TrameId: number;
};

export type UE = {
    Id: number;
    Name: string;
    TotalHourVolume_CM: number;
    TotalHourVolume_TD: number;
    TotalHourVolume_TP: number;
    ResponsibleName: string;
    Color: string;
    LayerId: number;
    TP_NeedInformaticRoom: boolean;
    TD_NeedInformaticRoom: boolean;
};

export interface Course {
  Id: number | string;
  UEId: number;
  Type: string;
  Date: string | Date;
  StartHour: string;
  length: number;
  TrameId: number;
  LayerId: number;
  ProfId?: number | null;
  Groups?: Group[];
  UEName?: string;
  ProfFullName?: string | null;
  EndHour?: string;
  originalId?: number | string; // Add this field to track the original ID during moves
}

// New types based on DB models
export type Group = {
    Id: number;
    Name: string;
};

export type Tokens = {
    Token: string;
    UserId: number;
    Expire: Date;
};

export type CoursePool = {
    Id : number;
    UEId : number;
    Type : string;
    Volume : number;
    UE: UE;
}

export type Event = {
    Id: number;
    Name: string;
    Date: string;
    StartHour: string;
    EndHour: string;
    TrameId: number;
};