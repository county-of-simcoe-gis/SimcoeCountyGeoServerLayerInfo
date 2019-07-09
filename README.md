# Simcoe County GeoServer Layer Info

## Live demo can be found [here](https://opengis.simcoe.ca/layerInfo/?URL=https://opengis.simcoe.ca/geoserver/rest/workspaces/simcoe/datastores/paradise/featuretypes/Ganaraska+Trail.json)

This app is designed to work with the GeoServer rest api. It displays basic Metadata information from the end point.

This app is called from layers component in our Web Map viewer [WebViewer](https://github.com/county-of-simcoe-gis/SimcoeCountyWebViewer).

It accepts a Url rest end point as a parameter.
e.g. https://opengis.simcoe.ca/layerInfo/?URL=https://opengis.simcoe.ca/geoserver/rest/workspaces/simcoe/datastores/paradise/featuretypes/Ganaraska+Trail.json

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

```
Node JS
```

### Installing

```
In the src directory, type `npm install` in the terminal.
In the src directory, type `npm start` in the terminal.
```

## Deployment

In the project diretory, type `npm run build` in the terminal. Details can be found with [Create React App](https://github.com/facebook/create-react-app)

## Built With

- [React](https://reactjs.org/) - create-react-app

## Authors

- **Al Proulx** - _Initial work_ - [Al Proulx](https://github.com/iquitwow)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
