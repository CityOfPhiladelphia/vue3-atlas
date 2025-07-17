export interface LanguageFile {
    LanguageCode:            string;
    LanguageName:            string;
    breadcrumbs:             Breadcrumbs;
    forceOffsetStatus:       ForceOffsetStatus;
    machineInformation:      MachineInformation;
    troubleshooting:         Troubleshooting;
    customCut:               CustomCut;
    troubleshoot:            Troubleshoot;
    home:                    Home;
    deviceIdentifier:        DeviceIdentifier;
    "home/cutterDialog":     HomeCutterDialog;
    footer:                  Footer;
    settings:                Settings;
    employees:               Employees;
    "settings/cutterStatus": SettingsCutterStatus;
    powerOff:                PowerOff;
    logOff:                  LogOff;
    reboot:                  PowerOff;
    wifi:                    Wifi;
    "wifi/connect":          WifiConnect;
    "wifi/disconnect":       WifiDisconnect;
    "wifi/connectDialog":    WifiConnectDialog;
    "wifi/dot":              WifiDot;
    "appBar/logo":           AppBarLogo;
    "appBar/nav":            AppBarNav;
    "appBar/searchBar":      AppBarSearchBar;
    graphtecGoPage:          GraphtecGoPage;
    searchResults:           SearchResults;
    loading:                 Loading;
    driverInstall:           DriverInstall;
    "sync/ran":              SyncR;
    "sync/running":          SyncR;
    ticketQrCode:            TicketQrCode;
    networkLockoutWarning:   NetworkLockoutWarning;
    networkLockout:          NetworkLockout;
    unassigned:              Unassigned;
    coverage:                Coverage;
    product:                 Product;
    sheet:                   Sheet;
    sale:                    Sale;
    employee:                ConfirmDialog;
    instructions:            Instructions;
    "instructions/adsi":     InstructionsAdsiClass;
    "instructions/graphtec": InstructionsAdsiClass;
    zone:                    Zone;
    summary:                 Summary;
    successfulCut:           SuccessfulCut;
    startCut:                StartCut;
    cutLoading:              CutLoading;
    confirmLoad:             ConfirmLoad;
    supportQR:               SupportQR;
    filmLoad:                FilmLoad;
    loadError:               LoadError;
    ejecting:                Ejecting;
    confirmDialog:           ConfirmDialog;
}

export interface AppBarLogo {
    loadingPreModelText:  string;
    loadingPostModelText: string;
    cuttingPreModelText:  string;
    cuttingPostModelText: string;
    pleaseWait:           string;
}

export interface AppBarNav {
    allDesignsTab: string;
    favoritesTab:  string;
    customCutTab:  string;
}

export interface AppBarSearchBar {
    label: string;
}

export interface Breadcrumbs {
    home:               string;
    settings:           string;
    employees:          string;
    wifi:               string;
    machineInformation: string;
    help:               string;
}

export interface ConfirmDialog {
    prompt: string;
}

export interface ConfirmLoad {
    prompt:     string;
    nextButton: string;
}

export interface Coverage {
    coverage:           string;
    prompt:             string;
    optionYes:          string;
    optionNo:           string;
    optionFront:        string;
    optionBack:         string;
    chooseCoverage:     string;
    hasCaseQuestion:    string;
    selectSide:         string;
    next:               string;
    optionNotAvailable: string;
}

export interface CustomCut {
    cut:                string;
    custom:             string;
    selectCustomDesign: string;
    notAvailable:       string;
}

export interface CutLoading {
    preModelText:  string;
    postModelText: string;
}

export interface DeviceIdentifier {
    deviceIdentifier: string;
    retryButton:      string;
    scanToUse:        string;
    qrCodeError:      string;
}

export interface DriverInstall {
    installing:  string;
    success:     string;
    error:       string;
    rebooting:   string;
    rebootError: string;
}

export interface Ejecting {
    filmModified: string;
    ejecting:     string;
}

export interface Employees {
    employees:             string;
    addEmployeeToLocation: string;
    nameField:             string;
    invalidName:           string;
    emailField:            string;
    invalidEmail:          string;
    emailExists:           string;
    addButton:             string;
    closeButton:           string;
}

export interface FilmLoad {
    filmLoading:        string;
    loadedSuccessfully: string;
    nextButton:         string;
}

export interface Footer {
    patentPending: string;
    station:       string;
    serial:        string;
    location:      string;
    version:       string;
}

export interface ForceOffsetStatus {
    title:       string;
    noOverrides: string;
}

export interface GraphtecGoPage {
    pre: string;
    go:  string;
    end: string;
}

export interface Home {
    preLinkText:              string;
    linkText:                 string;
    postLinkText:             string;
    needHelpQuestion:         string;
    warning:                  string;
    couldNotReach:            string;
    couldNotReachConsequence: string;
    help:                     string;
    settings:                 string;
}

export interface HomeCutterDialog {
    notConnected: string;
    actionPrompt: string;
    closeButton:  string;
    retryButton:  string;
}

export interface Instructions {
    prompt:     string;
    note:       string;
    nextButton: string;
}

export interface InstructionsAdsiClass {
    pushLeverDown:  string;
    insertSheet:    string;
    pushLeverUp:    string;
    adjustRollers?: string;
}

export interface LoadError {
    prompt:      string;
    error:       string;
    notDetected: string;
    badLoad:     string;
    backButton:  string;
    help:        string;
}

export interface Loading {
    tip: string;
}

export interface LogOff {
    prompt:        string;
    confirmButton: string;
    cancelButton:  string;
}

export interface MachineInformation {
    header:       string;
    serialNumber: string;
}

export interface NetworkLockout {
    locked:           string;
    lockoutInfo:      string;
    needHelpQuestion: string;
    contact:          string;
}

export interface NetworkLockoutWarning {
    regularWarningTitle: string;
    lockoutWarningTitle: string;
    warningInfo:         string;
    untilResolved:       string;
    noSoftwareUpdates:   string;
    noDesigns:           string;
    noRegistration:      string;
    willLockout:         string;
    okButton:            string;
}

export interface PowerOff {
    prompt:  string;
    confirm: string;
    cancel:  string;
    button:  string;
}

export interface Product {
    prompt:             string;
    optionNotAvailable: string;
}

export interface Sale {
    prompt:              string;
    optionNewSale:       string;
    optionWarrantyClaim: string;
    optionDiagnosticCut: string;
    optionNotAvailable:  string;
}

export interface SearchResults {
    goButton:                 string;
    manufacturer:             string;
    modelName:                string;
    otherNames:               string;
    noResults:                string;
    cutterNotConnected:       string;
    cutterNotConnectedAction: string;
}

export interface Settings {
    back:               string;
    settings:           string;
    closeButton:        string;
    language:           string;
    connectionStatuses: string;
    neverConnected:     string;
    manageEmployees:    string;
    employees:          string;
    machineInformation: string;
    internet:           string;
}

export interface SettingsCutterStatus {
    cutterStatus: string;
    resetting:    string;
    notConnected: string;
    connected:    string;
}

export interface Sheet {
    prompt:             string;
    optionNotAvailable: string;
    recommendedOption:  string;
}

export interface StartCut {
    goButton:   string;
    cutFailed:  string;
    backButton: string;
}

export interface SuccessfulCut {
    header:           string;
    ejectFilm:        string;
    backButton:       string;
    returnHomeButton: string;
    installationTips: string;
}

export interface Summary {
    coverage:    string;
    material:    string;
    saleType:    string;
    cutLocation: string;
    cutId:       string;
    time:        string;
    model:       string;
    product:     string;
    employee:    string;
    edit:        string;
    sheetSize:   string;
}

export interface SupportQR {
    support: string;
}

export interface SyncR {
    model:        string;
    manufacturer: string;
    coverage:     string;
}

export interface TicketQrCode {
    needHelpQuestion: string;
    contact:          string;
}

export interface Troubleshoot {
    manufacturer: string;
    model:        string;
}

export interface Troubleshooting {
    title:  string;
    button: string;
    help:   string;
}

export interface Unassigned {
    forceRefresh:  string;
    isAssigned:    string;
    isNotAssigned: string;
    proceedButton: string;
}

export interface Wifi {
    header:            string;
    networks:          string;
    myNetworks:        string;
    connectedNetworks: string;
    otherNetworks:     string;
    notConnected:      string;
}

export interface WifiConnect {
    success: string;
    failure: string;
}

export interface WifiConnectDialog {
    enterPassword: string;
    joinButton:    string;
    cancelButton:  string;
    reconnect:     string;
    forget:        string;
    disconnect:    string;
}

export interface WifiDisconnect {
    disconnect: string;
    failure:    string;
}

export interface WifiDot {
    noNetwork: string;
    online:    string;
    portal:    string;
    offline:   string;
    unknown:   string;
}

export interface Zone {
    prompt:                string;
    tip:                   string;
    phoneWatchZoneMessage: string;
    selectingZoneMessage:  string;
    nextButton:            string;
}
