import React, { Component } from 'react';
import './App.css';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import Paper from 'material-ui/Paper';
import {Tabs, Tab} from 'material-ui/Tabs';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import clearImg from './clear.svg'

class App extends Component {
  constructor(){
    super();
    this.state = {
      drawOpen: false,
      requestFailedA: false,
      requestFailedD: false,
      requestFailedS: false,
      trainArrival: [],
      trainDepature: [],
      stations: [],
      showCheckboxes: false,
      station: "Tampere",
      shortCode: "TPE",
      keys: 10,
    }

    /*
    Haetaan kaikkien asemien tiedot stations taulukkoon tässä vaiheessa niin ei tarvitse myöhemmin enään toistaa koodia.
    */
    fetch('https://rata.digitraffic.fi/api/v1/metadata/stations')
    .then(responseS => {
      if(!responseS.ok){
        throw Error("Jotain meni vikaan.")
      }
      return responseS
    })

    .then(resultsS => resultsS.json())
    .then(dataS => {
      let trainStation = dataS;
      this.setState({
        stations: trainStation,
      });
    }, () => {
      this.setState({
        requestFailedS: true,
      });
    });
  }

  /*
  Otetaan sivupaneeli esiin.
  */
  toggleDrawer = () => {
    this.setState(
      (prevState, props) => ({
        drawOpen: !prevState.drawOpen
      })
    );
  }

  /*
  Haetaan aseman lyhennettä vastaava aseman nimi lähtö- ja pääteasemille.
  */
  getStation = (s) => {
    for(var i = 0; i < this.state.stations.length; i++){
      if(s === this.state.stations[i].stationShortCode){
        if((this.state.stations[i].stationName.split(" ").length === 2 && this.state.stations[i].stationName.split(" ")[1] !== "asema") ||
            this.state.stations[i].stationName.split(" ").length === 1){
            return this.state.stations[i].stationName;
        }
        else{
          return this.state.stations[i].stationName.split(" ")[0];
        }
      }
    }
    return "Ei saatu aseman nimeä.";
  }

  /*
  Haetaan aika oikeaan muotoon.
  */
  getTime = (t, type) => {
    for(var i = 0; i < t.timeTableRows.length; i++){
      if(t.timeTableRows[i].stationShortCode === this.state.shortCode){
        if((t.timeTableRows[i].differenceInMinutes === 0 || !t.timeTableRows[i].liveEstimateTime) && (t.timeTableRows[i].cancelled === false) && (t.timeTableRows[i].type === type)){
          var date = new Date(t.timeTableRows[i].scheduledTime)
          return ('0' + date.getHours()).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2);
        }
        else if(t.timeTableRows[i].liveEstimateTime && t.timeTableRows[i].cancelled === false && t.timeTableRows[i].type === type){
          var dateL = new Date(t.timeTableRows[i].liveEstimateTime)
          var dateS = new Date(t.timeTableRows[i].scheduledTime)
          return ('0' + dateL.getHours()).slice(-2) + ":" + ('0' + dateL.getMinutes()).slice(-2) +
          " (" + ('0' + dateS.getHours()).slice(-2) + ":" + ('0' + dateS.getMinutes()).slice(-2) + ")";
        }
        else if(t.timeTableRows[i].cancelled === true && (t.timeTableRows[i].type === type)){
          var dateC = new Date(t.timeTableRows[i].scheduledTime)
          return ('0' + dateC.getHours()).slice(-2) + ":" + ('0' + dateC.getMinutes()).slice(-2) + " Cancelled";
        }
      }
    }
    return null;
  }

  /*
  Haetaan junan tyyppi. Eli onko lähijuna, kaukojuna vai tavarajuna.
  */
  getTrain = (t) => {
    if(t.trainCategory === "Commuter"){
      return "Commuter train " + t.commuterLineID;
    }
    else if(t.trainCategory === "Cargo"){
      return "Cargo train " + t.trainType + " " + t.trainNumber
    }
    else{
      return t.trainType + " " + t.trainNumber;
    }
  }

  /*
  Asetetaan avain.
  */
  getKey = () => {
      this.setState({
        keys: this.state.keys + 1,
      });
      return this.state.keys;
  }

  componentDidMount() {
    console.log("Initial start")
    /*
    Haetaan saapuvat junat.
    */
    this.getData();
    setInterval(this.getData, 60000);
  }
  
  getData = () => {
    console.log("Load station data");
    fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/' + this.state.shortCode + '?arrived_trains=0&arriving_trains=10&departed_trains=0&departing_trains=0&include_nonstopping=false')
      .then(responseA => {
        if(!responseA.ok) {
          throw Error("Jotain meni vikaan.")
        }
        return responseA;
      })
      .then(resultsA => resultsA.json())
      .then(dataA => {
        let trainA = dataA.map((trainA) => {
          return(
            <TableRow key={this.getKey()} style={{color: trainA.cancelled ? '#B0B0B0' : '#000000'}}>
                <TableRowColumn>
                  {this.getTrain(trainA)}
                </TableRowColumn>
                <TableRowColumn>
                  {this.getStation(trainA.timeTableRows[0].stationShortCode)}
                </TableRowColumn>
                <TableRowColumn>
                  {this.getStation(trainA.timeTableRows[trainA.timeTableRows.length - 1].stationShortCode)}
                </TableRowColumn>
                <TableRowColumn>
                  <p style={{color: this.getTime(trainA, "ARRIVAL").split(" ").length === 2 && !trainA.cancelled ? '#FF0000' : trainA.cancelled ? '#B0B0B0' : '#000000'}}>
                    {this.getTime(trainA, "ARRIVAL").split(" ")[0]}
                  </p>
                  <p style={{color: trainA.cancelled ? '#FF0000' : '#000000', fontSize: trainA.cancelled ? 13 : 11}}>
                    {this.getTime(trainA, "ARRIVAL").split(" ")[1]}
                  </p>
                </TableRowColumn>
            </TableRow>
          );
        });
        this.setState({
          trainArrival: trainA,
        });
      }, () => {
        this.setState({
          requestFailedA: true,
        });
      });

      /*
      Haetaan lähtevät junat.
      */
      fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/' + this.state.shortCode + '?arrived_trains=0&arriving_trains=0&departed_trains=0&departing_trains=10&include_nonstopping=false')
        .then(responseD => {
          if(!responseD.ok) {
            throw Error("Jotain meni vikaan.")
          }
          return responseD;
        })
        .then(resultsD => resultsD.json())
        .then(dataD => {
          let trainD = dataD.map((trainD) => {
            return(
              <TableRow key={this.getKey()} style={{color: trainD.cancelled ? '#B0B0B0' : '#000000'}}>
                  <TableRowColumn>
                    {this.getTrain(trainD)}
                  </TableRowColumn>
                  <TableRowColumn>
                    {this.getStation(trainD.timeTableRows[0].stationShortCode)}
                  </TableRowColumn >
                  <TableRowColumn>
                    {this.getStation(trainD.timeTableRows[trainD.timeTableRows.length - 1].stationShortCode)}
                  </TableRowColumn>
                  <TableRowColumn>
                    <p style={{color: this.getTime(trainD, "DEPARTURE").split(" ").length === 2 && !trainD.cancelled ? '#FF0000' : trainD.cancelled ? '#B0B0B0' : '#000000'}}>
                      {this.getTime(trainD, "DEPARTURE").split(" ")[0]}
                    </p>
                    <p style={{color: trainD.cancelled ? '#FF0000' : '#000000', fontSize: trainD.cancelled ? 13 : 11 }}>
                      {this.getTime(trainD, "DEPARTURE").split(" ")[1]}
                    </p>
                  </TableRowColumn>
              </TableRow>
            );
          });
          this.setState({
            trainDepature: trainD,
          });
        }, () => {
          this.setState({
            requestFailedD: true,
          });
        });
  }
  /*
  Asetetaan station arvoksi käyttäjän syöttämä arvo ja päivitetään name teksikenttä.
  */
  updateTextField = (newValue) => {
    this.setState({
      station: newValue,
      keys: 10,
    });
    /*
    Haetaan silmukan avulla haettua nimeä vastaava lyhenne.
    */
    for(var i = 0; i < this.state.stations.length; i++){
      /*
      Muutetaan arvot pienellä kirjoitettavaksi niin ei tarvitse olla haussa iso ensimmäinen kirjain.
      */
      if((this.state.stations[i].stationName.split(" ").length === 2 && this.state.stations[i].stationName.split(" ")[0].toLowerCase() === newValue.toLowerCase() && this.state.stations[i].stationName.split(" ")[1] === "asema") ||
        (this.state.stations[i].stationName.split(" ").length === 1 && this.state.stations[i].stationName.toLowerCase() === newValue.toLowerCase())){
        /*
        this.setState oli tässä liian hidas muuttamaan arvoa shortCode. Eli shortCode ei kerinnyt päivittyä ennen kuin componentDidMount
        functio sitä tarvitsi ja ohjelma kaatui siihe.
        */
        // eslint-disable-next-line
        this.state.shortCode = this.state.stations[i].stationShortCode;
        this.getData()
      }
    }
  }

  /*
  Tyhjennetään tekstikenttä.
  */
  clear = (event) => {
    this.setState({
      station: "",
    });
    this.refs.input.focus();
  }

  render() {
    /*
    Annetaan ilmoitus jos jossain API linkissä on vikaa.
    */
    if(this.state.requestFailedA) return <p>Failed arriving</p>
    if(this.state.requestFailedD) return <p>Failed departing</p>
    if(this.state.requestFailedS) return <p>Failed stations</p>
    return (
        <MuiThemeProvider>
          <Paper>
            <AppBar title="Aseman junatiedot"
                style={{backgroundColor: '#519e16'}}
                onLeftIconButtonClick={this.toggleDrawer}>
            </AppBar>
            <Drawer open={this.state.drawOpen}>
              <AppBar
                style={{backgroundColor: '#519e16'}}
                onLeftIconButtonClick={this.toggleDrawer}>
              </AppBar>
              <MenuItem>Tulossa pian</MenuItem>
            </Drawer>
            <div style={{marginLeft: 50}}>
              <TextField
                ref='input'
                type='text'
                id="name"
                label="Hae aseman nimellä"
                floatingLabelText="Hae aseman nimellä"
                floatingLabelFixed={true}
                floatingLabelStyle={{color: '#519e16'}}
                underlineFocusStyle={{borderColor: '#519e16'}}
                value={this.state.station}
                onChange={(e, v) => {this.updateTextField(v);}}>
              </TextField>
              <img src={clearImg} alt="Oivoi" onClick={this.clear}/>
            </div>
            <Tabs>
              <Tab label="Saapuvat" style={{backgroundColor: '#519e16'}}>
                <Table>
                  <TableHeader displaySelectAll={this.state.showCheckboxes} adjustForCheckbox={false}>
                    <TableRow>
                      <TableHeaderColumn>Juna</TableHeaderColumn>
                      <TableHeaderColumn>Lähtöasema</TableHeaderColumn>
                      <TableHeaderColumn>Pääteasema</TableHeaderColumn>
                      <TableHeaderColumn>Saapuu</TableHeaderColumn>
                    </TableRow>
                  </TableHeader>
                  <TableBody stripedRows={true} displayRowCheckbox={this.state.showCheckboxes}>
                    {this.state.trainArrival}
                  </TableBody>
                </Table>
              </Tab>
              <Tab label="Lähtevät" style={{backgroundColor: '#519e16'}}>
                <Table>
                  <TableHeader displaySelectAll={this.state.showCheckboxes} adjustForCheckbox={false}>
                    <TableRow>
                      <TableHeaderColumn>Juna</TableHeaderColumn>
                      <TableHeaderColumn>Lähtöasema</TableHeaderColumn>
                      <TableHeaderColumn>Pääteasema</TableHeaderColumn>
                      <TableHeaderColumn>Lähtee</TableHeaderColumn>
                    </TableRow>
                  </TableHeader>
                  <TableBody stripedRows={true} displayRowCheckbox={this.state.showCheckboxes}>
                    {this.state.trainDepature}
                  </TableBody>
                </Table>
              </Tab>
            </Tabs>
          </Paper>
        </MuiThemeProvider>
    );
  }
}
export default App;
