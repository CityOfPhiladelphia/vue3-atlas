class SearchData {
  constructor(parameters = {}) {
    const {
      address,
      opaAddress,
      opaAccount,
      opaAccountValue,
      opaAddressValue,
      parcelId,
      parcelDescription,
    } = parameters;

    this.address = address;
    this.opaAddress = opaAddress;
    this.opaAccount = opaAccount;
    this.opaAccountValue = opaAccountValue;
    this.opaAddressValue = opaAddressValue;
    this.parcelId = parcelId;
    this.parcelDescription = parcelDescription;
  }
}

const buildingAddressData = new SearchData({
  address: "1234 MARKET ST",
  opaAddress: "OPA Address",
  opaAccount: "OPA Account #",
  opaAccountValue: "883309050",
  opaAddressValue: "1234 MARKET ST",
  parcelId: "001S070144",
  parcelDescription: "CMX-5",
});

const condoAddressData = new SearchData({
  address: "220 W WASHINGTON SQ",
  opaAddress: "Address",
  opaAccount: "OPA Account #",
  opaAccountValue: "888057400",
  opaAddressValue: "220 W WASHINGTON SQ APT 100220 W WASHINGTON SQ APT 100",
  parcelId: "002S100096",
  parcelDescription: "RM-4",
});

const pwdAddressData = new SearchData({
  address: "5036 HAWTHORNE ST",
  opaAddress: "Address",
  opaAccount: "OPA Account #",
  opaAccountValue: "622250305",
  opaAddressValue: "5032-36 HAWTHORNE ST",
  parcelId: "089N040106",
  parcelDescription: "RSA-5",
});

const dorAddressData = new SearchData({
  address: "5669 CHESTNUT ST",
  opaAddress: "Parcel Address",
  opaAccount: "Map Registry #",
  opaAccountValue: "018S030074",
  opaAddressValue: "5627-99 CHESTNUT ST",
  parcelId: "018S030074",
  parcelDescription: "CA-2",
});

module.exports = {
  buildingAddressData,
  condoAddressData,
  pwdAddressData,
  dorAddressData,
  URL:"https://atlas-dev.phila.gov/",
  HEADLESS_MODE: true,
  BROWSER:"chrome",
};
