import React, { Component } from "react";
import "./App.css";
import * as helpers from "./helpers";
import MapComponent from "./MapComponent.jsx";

// THIS APP ACCEPTS A FULL URL TO GEOSERVER LAYER
// E.G.  https://opengis.simcoe.ca/geoserver/rest/workspaces/simcoe/datastores/paradise/featuretypes/Railway.json

const url = new URL(window.location.href);
const layerURL = url.searchParams.get("URL");

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      layerInfo: this.getInfo()
    };
  }

  // GET LAYER INFO FROM URL
  getInfo() {
    if (layerURL == null) return;

    helpers.getJSON(layerURL, response => {
      this.setState({ layerInfo: response.featureType });
    });
  }

  // CLEAN UP THE PROJECTION STRING
  getFormattedProjection = () => {
    const projClass = this.state.layerInfo.nativeCRS["@class"];
    let projArray = this.state.layerInfo.nativeCRS["$"].split('"');

    return helpers.toTitleCase(projClass) + " - " + projArray[1];
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

  render() {
    if (this.state.layerInfo === undefined || this.state.layerInfo.nativeCRS === undefined)
      return <h3 className={layerURL == null ? "gli-main-error" : "gli-main-error hidden"}>Error: Layer Not Found or no URL Parameter provided.</h3>;

    const proj = this.getFormattedProjection();
    const fields = this.state.layerInfo.attributes.attribute;
    const crs = this.state.layerInfo.nativeCRS["$"];
    const boundingBox = this.state.layerInfo.nativeBoundingBox;

    return (
      <div className="main-container">
        <h1 className={layerURL == null ? "gli-main-error" : "gli-main-error hidden"}>Error: Layer Not Found</h1>
        <div className="header">
          <table style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td className="title">{this.state.layerInfo.title}</td>
                <td style={{ width: "60px" }}>
                  <img onClick={this.onShareClick} title="Share this page through E-Mail" className="headerButton" src={images["share-icon.png"]} />
                </td>

                <td style={{ width: "60px" }}>
                  <img
                    onClick={() => {
                      window.print();
                    }}
                    title="Print this page"
                    className="headerButton"
                    src={images["print-icon.png"]}
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
                  />
                </td>
              </tr>
            </tbody>
          </table>
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
              {fields.map(fieldInfo => (
                <FieldItem key={helpers.getUID()} fieldInfo={fieldInfo} />
              ))}
            </div>
          </fieldset>
        </div>

        <div className="footer">
          <div style={{ float: "left" }}>
            Layer info page generated using{" "}
            <a href="https://opengis.simcoe.ca" target="_blank">
              maps.simcoe.ca
            </a>{" "}
            interactive mapping.
            <br />
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
