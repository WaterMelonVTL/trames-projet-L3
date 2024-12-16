export type ECU = {
    name: string,
    numberOfCM: number,
    numberOfTD: number,
    enseignantCM: string,
    enseignantTD: string[],
    color: string,
    AmphiParDefaut: string,
    TDParDefaut: string
};
export type CoursFrame = {
    name: string,
    enseignant: string[],
    type: string,
    color: string,
    salle: string,
    ecu: ECU
};
export type Cours = {
    id: number,
    nom: string,
    type: string,
    enseignant: string,
    date: string,
    jour: number,
    start: number,
    salle: string,
    groupe: string[],
    offset: number,
    couleur: string,
    durée: number
}

