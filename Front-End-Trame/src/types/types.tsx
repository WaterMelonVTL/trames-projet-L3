export type User = {
    Id: number;
    FirstName: string;
    LastName: string;
    Email: string;
    Password: string;
    Points: number;
    Picture?: string;
    Role: string;
};

export type Context = {
    Id: number;
    Name: string;
    Owner: number;
};

export type Tramme = {
    Id: number;
    Name: string;
    Owner: number;
    Year: number;
};

export type Layer = {
    Id: number;
    Name: string;
    TrammeId: number;
    Color: string;
};

export type Prof = {
    Id: number;
    FirstName: string;
    LastName: string;
    Status: string;
    Sexe?: string;
    TrammeId: number;
};

export type Room = {
    Id: number;
    Name: string;
    Informatised: boolean;
    ContextId: number;
    Capacity?: number;
};

export type UE = {
    Id: number;
    Name: string;
    TotalHourVolume_CM: number;
    TotalHourVolume_TD: number;
    DefaultHourVolumeHebdo_CM: number;
    DefaultHourVolumeHebdo_TD: number;
    Color: string;
    DefaultRoomId: number;
    TrammeId: number;
};

export type Course = {
    Id: number;
    UEId: number;
    Date: string;
    StartHour: string;
    length: number;
    TrammeId: number;
    RoomId: number;
    LayerId: number;
};

