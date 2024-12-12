import React, { Component } from "react";
import "./App.css";
import * as helpers from "./helpers";
import mainConfig from "./config.json";
import ReactGA from "react-ga4";

if (mainConfig.googleAnalyticsID !== undefined && mainConfig.googleAnalyticsID !== "") {
  ReactGA.initialize(mainConfig.googleAnalyticsID);
  ReactGA.send({ hitType: "pageview", page: window.location.pathname + window.location.search });
}

// THIS APP ACCEPTS A FULL URL TO GEOSERVER LAYER
// E.G.  https://opengis.simcoe.ca/geoserver/rest/workspaces/simcoe/datastores/paradise/featuretypes/Railway.json

const url = new URL(window.location.href);
const layerURL = url.searchParams.get("URL");
const showDownload = url.searchParams.get("SHOW_DOWNLOAD");

let serverUrl = null;
let downloadTemplate = null;
if (layerURL !== null) {
  serverUrl = layerURL.split("rest/")[0];
  downloadTemplate = (serverUrl, workspace, layerName) => `${serverUrl}wfs?service=wfs&version=1.1.0&request=GetFeature&typeNames=${workspace}:${layerName}&outputFormat=SHAPE-ZIP`;
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      layerInfo: undefined,
      termsAccepted: false,
    };
  }
  componentDidMount() {
    this.getInfo();
  }
  // GET LAYER INFO FROM URL
  async getInfo() {
    if (layerURL == null) return;

    helpers.getJSON(layerURL, (response) => {
      if (response.featureType === undefined) {
        response["featureType"] = this.parseArcGisFeature(response, (result) => {
          this.setState({ layerInfo: result });
        });
      } else {
        this.setState({ layerInfo: response.featureType });
      }
    });
  }

  parseArcGisFeature = (featureInfo, callback) => {
    let featureType = {};
    featureType["nativeCRS"] = {};
    featureType.nativeCRS["@class"] = "Projected";
    if (featureInfo.sourceSpatialReference.wkt === undefined) {
      featureType.nativeCRS["$"] = ` "EPSG:${featureInfo.sourceSpatialReference.latestWkid}`;
    } else {
      if (featureInfo.sourceSpatialReference.wkt.indexOf("GEOGCS") !== -1) featureType.nativeCRS["@class"] = "Geographic";
      featureType.nativeCRS["$"] = featureInfo.sourceSpatialReference.wkt;
    }

    featureType["title"] = featureInfo.name;
    featureType["name"] = featureInfo.name;
    featureType["nativeBoundingBox"] = {};
    featureType.nativeBoundingBox["minx"] = featureInfo.extent.xmin;
    featureType.nativeBoundingBox["maxx"] = featureInfo.extent.xmax;
    featureType.nativeBoundingBox["miny"] = featureInfo.extent.ymin;
    featureType.nativeBoundingBox["maxy"] = featureInfo.extent.ymax;
    let nativeBoundingBoxCrs = {};
    nativeBoundingBoxCrs["@class"] = "projected";
    nativeBoundingBoxCrs["$"] = `EPSG:${featureInfo.extent.spatialReference.latestWkid}`;
    featureType.nativeBoundingBox["crs"] = nativeBoundingBoxCrs;
    const descriptionObj = helpers.parseESRIDescription(featureInfo.description);
    featureType["abstract"] = descriptionObj.description;
    featureType["attributes"] = {};
    featureType.attributes["attribute"] = featureInfo.fields.map((item) => {
      return { name: item.name, binding: item.type.replace("esriFieldType", "") };
    });
    // const epsgUrl = (wkt) => `https://epsg.io/${wkt}.wkt`;
    const epsgUrl = (wkt) => `https://opengis.simcoe.ca/api_v2/public/map/geometry/epsg/${wkt}/wkt`;

    if (featureInfo.sourceSpatialReference.latestWkid === undefined) callback(featureType);
    else
      helpers.httpGetText(epsgUrl(featureInfo.sourceSpatialReference.latestWkid), (projection) => {
        if (projection !== "ERROR") featureType.nativeCRS["$"] = projection;
        callback(featureType);
      });
  };
  // CLEAN UP THE PROJECTION STRING
  getFormattedProjection = () => {
    let projClass = "";
    if (this.state.layerInfo.nativeCRS["@class"] === undefined) {
      if (this.state.layerInfo.nativeCRS.indexOf("GEOGCS") !== -1) projClass = "Geographic";
      else projClass = "Projected";
    } else {
      projClass = this.state.layerInfo.nativeCRS["@class"];
    }

    let proj = "Undefined";
    if (this.state.layerInfo.nativeCRS["$"] === undefined) {
      let projArray = this.state.layerInfo.nativeCRS.split('"');
      proj = helpers.toTitleCase(projClass) + " - " + projArray[1];
    } else {
      let projArray = this.state.layerInfo.nativeCRS["$"].split('"');
      proj = helpers.toTitleCase(projClass) + " - " + projArray[1];
    }

    //console.log(proj);
    return proj;
  };

  // FORMAT DATE FOR FOOTER
  formatDate() {
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    var date = new Date();
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return monthNames[monthIndex] + " " + day + ", " + year;
  }

  onShareClick = () => {
    var mailToSubject = "Layer Metdata for " + this.state.layerInfo.title;
    var mailToBody = window.location.href;
    var mailTo = "mailto:?subject=" + mailToSubject + "&body=" + mailToBody;
    window.location.href = mailTo;
  };

  onTermsChange = (evt) => {
    this.setState({ termsAccepted: evt.target.checked });
  };

  onDownloadClick = (evt) => {
    const workspace = this.state.layerInfo.namespace.name;
    const layerName = this.state.layerInfo.name;
    window.open(downloadTemplate(serverUrl, workspace, layerName), "_blank");
  };
  render() {
    if (this.state.layerInfo === undefined || this.state.layerInfo.nativeCRS === undefined)
      return <h3 className={layerURL == null ? "gli-main-error" : "gli-main-error hidden"}>Error: Layer Not Found or no URL Parameter provided.</h3>;

    const proj = this.getFormattedProjection();
    let fields = this.state.layerInfo.attributes.attribute;
    if (!Array.isArray(fields)) fields = [fields];

    const crs = this.state.layerInfo.nativeCRS["$"];
    const boundingBox = this.state.layerInfo.nativeBoundingBox;

    //console.log(showDownload);
    return (
      <div className="main-container">
        <h1 className={layerURL == null ? "gli-main-error" : "gli-main-error hidden"}>Error: Layer Not Found</h1>
        <div className="header">
          <table style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td className="title">{this.state.layerInfo.title}</td>
                <td style={{ width: "60px" }}>
                  <img onClick={this.onShareClick} title="Share this page through E-Mail" className="headerButton" src={images["share-icon.png"]} alt="Share" />
                </td>

                <td style={{ width: "60px" }}>
                  <img
                    onClick={() => {
                      window.print();
                    }}
                    title="Print this page"
                    className="headerButton"
                    src={images["print-icon.png"]}
                    alt="Print"
                  />
                </td>
                <td style={{ width: "60px" }}>
                  <img
                    onClick={() => {
                      window.open(window.location.href, "_blank");
                    }}
                    title="Open this page in a new window"
                    className="headerButton"
                    src={images["new-window-icon.png"]}
                    alt="New Window"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={showDownload == 1 && this.state.layerInfo.name !== "Assessment Parcel" ? "item-container" : "hidden"}>
          <fieldset>
            <legend>Download</legend>
            <div className="item-content">
              <button className={this.state.termsAccepted ? "" : "disabled"} onClick={this.onDownloadClick}>
                Download
              </button>
              <div className="download-container">
                <label>
                  <input type="checkbox" onChange={this.onTermsChange}></input>By dowloading this information you accept the terms of the Open Government License - Simcoe County.
                </label>
                &nbsp;
                <a href="http://maps.simcoe.ca/openlicense.html" target="_blank" rel="noopener noreferrer">
                  View License
                </a>
              </div>
            </div>
          </fieldset>
        </div>

        <div className="item-container">
          <fieldset>
            <legend>Abstract</legend>
            <div className="item-content">{this.state.layerInfo.abstract}</div>
          </fieldset>
        </div>

        <div className="item-container">
          <fieldset>
            <legend>Projection</legend>
            <div className="item-content">{proj}</div>
          </fieldset>
        </div>

        <div className="item-container">
          <fieldset>
            <legend>Attribute Fields</legend>
            <div className="item-content-fields">
              {fields.map((fieldInfo) => (
                <FieldItem key={helpers.getUID()} fieldInfo={fieldInfo} />
              ))}
            </div>
          </fieldset>
        </div>

        <div className="footer">
          <div style={{ float: "left" }}>
            <div>
              <a href="http://maps.simcoe.ca/openlicense.html" target="_blank" rel="noopener noreferrer">
                View Terms of Use
              </a>
            </div>
            <br />
            <div>
              Layer info page generated using{" "}
              <a href="https://opengis.simcoe.ca" target="_blank" rel="noopener noreferrer">
                opengis.simcoe.ca
              </a>{" "}
              interactive mapping.
              <br />
            </div>
          </div>
          <div style={{ float: "right" }}>{"Generated on: " + this.formatDate()}</div>
        </div>
      </div>
    );
  }
}

export default App;

// IMPORT ALL IMAGES
const images = importAllImages(require.context("./images", false, /\.(png|jpe?g|svg|gif)$/));
function importAllImages(r) {
  let images = {};
  r.keys().map((item, index) => {
    images[item.replace("./", "")] = r(item);
  });
  return images;
}

function FieldItem(props) {
  const fieldInfo = props.fieldInfo;
  const name = fieldInfo.name;
  const dataTypeArray = fieldInfo.binding.split(".");
  const dataType = dataTypeArray[dataTypeArray.length - 1];

  return (
    <div style={{ margin: "5px" }}>
      <b>{name}</b>
      {" ( " + dataType + " )"}
    </div>
  );
}
